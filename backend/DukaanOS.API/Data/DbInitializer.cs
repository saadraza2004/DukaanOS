using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace DukaanOS.API.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(DukaanDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // 0. Ensure Stores Exist
        if (!await context.Stores.AnyAsync())
        {
            var store1 = new Store
            {
                Name = "Madina Kiryana & General Store",
                OwnerName = "Malik Muhammad Usman",
                Phone = "0300-1122334",
                Address = "Gali # 3, Main Bazaar",
                City = "Lahore",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var store2 = new Store
            {
                Name = "Bismillah Super Store",
                OwnerName = "Chaudhry Riaz",
                Phone = "0321-4455667",
                Address = "Shop # 8, Commercial Market",
                City = "Lahore",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Stores.AddRange(store1, store2);
            await context.SaveChangesAsync();
        }

        var s1 = await context.Stores.FirstAsync();
        var s2 = await context.Stores.OrderBy(s => s.Id).LastAsync();

        if (await context.Users.AnyAsync())
        {
            // Seed Store 2 users if they don't exist yet
            if (!await context.Users.AnyAsync(u => u.Username == "bismillah_owner"))
            {
                var bismillahOwner = new User
                {
                    StoreId = s2.Id,
                    Username = "bismillah_owner",
                    FullName = "Chaudhry Riaz (Bismillah Store Owner)",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = UserRole.OWNER,
                    CreatedAt = DateTime.UtcNow
                };

                var bismillahCashier = new User
                {
                    StoreId = s2.Id,
                    Username = "bismillah_cashier",
                    FullName = "Hamza Riaz (Counter Cashier)",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("cashier123"),
                    Role = UserRole.CASHIER,
                    CreatedAt = DateTime.UtcNow
                };

                context.Users.AddRange(bismillahOwner, bismillahCashier);

                // Seed sample customer and product for Store 2
                var bismillahCust = new Customer
                {
                    StoreId = s2.Id,
                    Name = "Irfan Tailor (Commercial Market)",
                    Phone = "0333-1122445",
                    Address = "Shop # 4, Commercial Market",
                    MaxCreditLimit = 25000m,
                    CurrentBalance = 1200m,
                    IsActive = true
                };

                var cat = await context.Categories.FirstOrDefaultAsync();
                var bismillahProd = new Product
                {
                    StoreId = s2.Id,
                    Name = "Supreme Basmati Rice 5kg Bag",
                    UrduName = "سپریم باسمتی چاول ۵ کلو تھیلا",
                    RomanUrduName = "Supreme Basmati Chawal 5kg",
                    CategoryId = cat?.Id ?? 1,
                    UnitType = UnitType.PACK,
                    BaseUnitRatio = 1m,
                    CurrentSellingPrice = 1850m,
                    MinStockThreshold = 5m,
                    CurrentStockBaseUnit = 20m,
                    Sku = "BISM-RIC-5KG",
                    IsActive = true
                };

                context.Customers.Add(bismillahCust);
                context.Products.Add(bismillahProd);
                await context.SaveChangesAsync();
            }

            return; // DB has already been seeded
        }

        // 1. Seed Store 1 Users (BCrypt hashed)
        var owner = new User
        {
            StoreId = s1.Id,
            Username = "owner",
            FullName = "Malik Muhammad Usman (Store Owner)",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = UserRole.OWNER,
            CreatedAt = DateTime.UtcNow
        };

        var cashier = new User
        {
            StoreId = s1.Id,
            Username = "cashier",
            FullName = "Tariq Mahmood (Counter Cashier)",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("cashier123"),
            Role = UserRole.CASHIER,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(owner, cashier);
        await context.SaveChangesAsync();

        // 2. Seed Categories
        var catRation = new Category { Name = "Ration & Pulses (Galla / Daalein)", UrduName = "غلہ و دالیں", DisplayOrder = 1 };
        var catSpices = new Category { Name = "Spices & Salt (Masalajat)", UrduName = "مصالحہ جات", DisplayOrder = 2 };
        var catOils = new Category { Name = "Cooking Oil & Ghee", UrduName = "کوکنگ آئل و گھی", DisplayOrder = 3 };
        var catTeaBev = new Category { Name = "Tea & Beverages (Chaye / Mashroobat)", UrduName = "چائے و مشروبات", DisplayOrder = 4 };
        var catSnacks = new Category { Name = "Biscuits & Confectionery", UrduName = "بسکٹ اور بیکری", DisplayOrder = 5 };
        var catCleaning = new Category { Name = "Soaps & Detergents (Safai)", UrduName = "صابن اور سرف", DisplayOrder = 6 };
        var catPersonal = new Category { Name = "Personal Care & Toiletries", UrduName = "ذاتی نگہداشت", DisplayOrder = 7 };

        context.Categories.AddRange(catRation, catSpices, catOils, catTeaBev, catSnacks, catCleaning, catPersonal);
        await context.SaveChangesAsync();

        // 3. Seed Suppliers
        var sup1 = new Supplier { Name = "Akbari Mandi Grain Traders", ContactPerson = "Chaudhry Riaz", Phone = "0300-1234567", Address = "Akbari Mandi, Lahore" };
        var sup2 = new Supplier { Name = "Unilever Pakistan Wholesale", ContactPerson = "Kamran Ali", Phone = "0321-7654321", Address = "Ferozepur Road, Lahore" };
        var sup3 = new Supplier { Name = "National Foods Distributor", ContactPerson = "Sheikh Bilal", Phone = "0333-9876543", Address = "Badami Bagh, Lahore" };

        context.Suppliers.AddRange(sup1, sup2, sup3);
        await context.SaveChangesAsync();

        // 4. Seed Products
        var products = new List<Product>
        {
            // Loose Rice
            new() {
                Name = "Super Basmati Rice (Karnal)",
                UrduName = "سپر باسمتی چاول (کرنال)",
                RomanUrduName = "Super Basmati Chawal Karnal",
                CategoryId = catRation.Id,
                UnitType = UnitType.KG,
                BaseUnitRatio = 1000m, // 1kg = 1000g
                CurrentSellingPrice = 350.00m, // Rs. 350 per KG
                MinStockThreshold = 20.00m,
                CurrentStockBaseUnit = 70000m, // 70kg in grams
                Sku = "RIC-BAS-001"
            },
            new() {
                Name = "Kainat 1121 Steam Rice",
                UrduName = "کائنات ۱۱۲۱ سٹیم چاول",
                RomanUrduName = "Kainat 1121 Steam Chawal",
                CategoryId = catRation.Id,
                UnitType = UnitType.KG,
                BaseUnitRatio = 1000m,
                CurrentSellingPrice = 380.00m,
                MinStockThreshold = 15.00m,
                CurrentStockBaseUnit = 45000m, // 45kg in grams
                Sku = "RIC-KAI-002"
            },
            new() {
                Name = "Daal Chana (Special)",
                UrduName = "دال چنا (خاص)",
                RomanUrduName = "Daal Chana Khas",
                CategoryId = catRation.Id,
                UnitType = UnitType.KG,
                BaseUnitRatio = 1000m,
                CurrentSellingPrice = 280.00m,
                MinStockThreshold = 15.00m,
                CurrentStockBaseUnit = 50000m,
                Sku = "DAL-CHA-001"
            },
            new() {
                Name = "Daal Moong Dhuli",
                UrduName = "دال مونگ دھلی",
                RomanUrduName = "Daal Moong Dhuli Peeli",
                CategoryId = catRation.Id,
                UnitType = UnitType.KG,
                BaseUnitRatio = 1000m,
                CurrentSellingPrice = 320.00m,
                MinStockThreshold = 10.00m,
                CurrentStockBaseUnit = 35000m,
                Sku = "DAL-MOO-002"
            },
            new() {
                Name = "White Sugar (Cheeni)",
                UrduName = "چینی سفید",
                RomanUrduName = "Cheeni Safaid White Sugar",
                CategoryId = catRation.Id,
                UnitType = UnitType.KG,
                BaseUnitRatio = 1000m,
                CurrentSellingPrice = 145.00m,
                MinStockThreshold = 40.00m,
                CurrentStockBaseUnit = 120000m, // 120kg in grams
                Sku = "SUG-WHT-001"
            },
            new() {
                Name = "Chakki Atta (Whole Wheat)",
                UrduName = "چکی کا آٹا (گندم)",
                RomanUrduName = "Chakki Ka Atta Gandum Flour",
                CategoryId = catRation.Id,
                UnitType = UnitType.KG,
                BaseUnitRatio = 1000m,
                CurrentSellingPrice = 130.00m,
                MinStockThreshold = 50.00m,
                CurrentStockBaseUnit = 150000m, // 150kg in grams
                Sku = "FLR-ATT-001"
            },

            // Cooking Oils
            new() {
                Name = "Mezan Canola Cooking Oil 1L Pouch",
                UrduName = "میزان کینولا کوکنگ آئل ۱ لٹر",
                RomanUrduName = "Mezan Canola Cooking Oil Pouch Tel",
                CategoryId = catOils.Id,
                UnitType = UnitType.PACK,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 520.00m,
                MinStockThreshold = 10m,
                CurrentStockBaseUnit = 48m,
                Barcode = "8964000123456",
                Sku = "OIL-MEZ-1L"
            },
            new() {
                Name = "Dalda Banaspati Ghee 1kg Pouch",
                UrduName = "ڈالڈا بناسپتی گھی ۱ کلو",
                RomanUrduName = "Dalda Banaspati Ghee Pouch",
                CategoryId = catOils.Id,
                UnitType = UnitType.PACK,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 540.00m,
                MinStockThreshold = 10m,
                CurrentStockBaseUnit = 36m,
                Barcode = "8964000123487",
                Sku = "GHE-DAL-1K"
            },
            new() {
                Name = "Loose Pure Mustard Oil (Sarson Ka Tel)",
                UrduName = "کھلا سرسوں کا تیل",
                RomanUrduName = "Sarson Ka Tel Sarson Ka Tail Khula Tel Mustard Oil",
                CategoryId = catOils.Id,
                UnitType = UnitType.LITRE,
                BaseUnitRatio = 1000m, // 1 litre = 1000 ml
                CurrentSellingPrice = 480.00m,
                MinStockThreshold = 10m,
                CurrentStockBaseUnit = 25000m, // 25 Litres in ML
                Sku = "OIL-SAR-LOO"
            },

            // Spices
            new() {
                Name = "National Lal Mirch Powder 200g",
                UrduName = "نیشنل سرخ مرچ پاؤڈر ۲۰۰ گرام",
                RomanUrduName = "National Lal Mirch Surkh Mirch Powder Red Chilli",
                CategoryId = catSpices.Id,
                UnitType = UnitType.PACK,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 280.00m,
                MinStockThreshold = 6m,
                CurrentStockBaseUnit = 24m,
                Barcode = "8964000210011",
                Sku = "SPI-NAT-RED"
            },
            new() {
                Name = "National Iodized Salt 800g",
                UrduName = "نیشنل نمک ۸۰۰ گرام",
                RomanUrduName = "National Namak Iodized Salt",
                CategoryId = catSpices.Id,
                UnitType = UnitType.PACK,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 70.00m,
                MinStockThreshold = 15m,
                CurrentStockBaseUnit = 60m,
                Barcode = "8964000210059",
                Sku = "SPI-NAT-SLT"
            },
            new() {
                Name = "Loose Zeera Safaid (Cumin)",
                UrduName = "کھلا زیرہ سفید",
                RomanUrduName = "Zeera Safaid Cumin Khula",
                CategoryId = catSpices.Id,
                UnitType = UnitType.KG,
                BaseUnitRatio = 1000m,
                CurrentSellingPrice = 2400.00m, // Rs. 2400/kg
                MinStockThreshold = 2m,
                CurrentStockBaseUnit = 8000m, // 8kg in grams
                Sku = "SPI-ZER-LOO"
            },

            // Beverages & Tea
            new() {
                Name = "Tapal Danedar Tea 400g Pouch",
                UrduName = "ٹپال دانے دار چائے ۴۰۰ گرام",
                RomanUrduName = "Tapal Danedar Chaye Chai Tea Patti",
                CategoryId = catTeaBev.Id,
                UnitType = UnitType.PACK,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 640.00m,
                MinStockThreshold = 10m,
                CurrentStockBaseUnit = 30m,
                Barcode = "8964000311223",
                Sku = "TEA-TAP-400"
            },
            new() {
                Name = "Rooh Afza Syrup 800ml Bottle",
                UrduName = "روح افزا شربت ۸۰۰ ملی لٹر",
                RomanUrduName = "Rooh Afza Sharbath Sharbat Bottle",
                CategoryId = catTeaBev.Id,
                UnitType = UnitType.PIECE,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 420.00m,
                MinStockThreshold = 8m,
                CurrentStockBaseUnit = 24m,
                Barcode = "8964000319999",
                Sku = "BEV-ROO-800"
            },
            new() {
                Name = "Coca-Cola 1.5 Litre Pet Bottle",
                UrduName = "کوکا کولا ۱.۵ لٹر",
                RomanUrduName = "Coca Cola Bottle Coke Cold Drink",
                CategoryId = catTeaBev.Id,
                UnitType = UnitType.PIECE,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 200.00m,
                MinStockThreshold = 12m,
                CurrentStockBaseUnit = 28m,
                Barcode = "8964000317788",
                Sku = "BEV-COK-1.5"
            },

            // Snacks & Biscuits
            new() {
                Name = "Peek Freans Sooper Biscuit (Half Roll)",
                UrduName = "سوپر بسکٹ ہاف رول",
                RomanUrduName = "Sooper Biscuit Peek Freans Half Roll",
                CategoryId = catSnacks.Id,
                UnitType = UnitType.PACK,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 60.00m,
                MinStockThreshold = 24m,
                CurrentStockBaseUnit = 72m,
                Barcode = "8964000411122",
                Sku = "BIS-SOP-HLF"
            },
            new() {
                Name = "Peek Freans Rio Strawberry Cream",
                UrduName = "ریو اسٹرابیری کریم بسکٹ",
                RomanUrduName = "Rio Strawberry Biscuit Peek Freans",
                CategoryId = catSnacks.Id,
                UnitType = UnitType.PACK,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 60.00m,
                MinStockThreshold = 20m,
                CurrentStockBaseUnit = 48m,
                Barcode = "8964000411139",
                Sku = "BIS-RIO-STR"
            },

            // Detergents & Soaps
            new() {
                Name = "Surf Excel 1kg Washing Powder",
                UrduName = "سرف ایکسل ۱ کلو",
                RomanUrduName = "Surf Excel Washing Powder Detergent 1kg",
                CategoryId = catCleaning.Id,
                UnitType = UnitType.PACK,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 620.00m,
                MinStockThreshold = 10m,
                CurrentStockBaseUnit = 35m,
                Barcode = "8964000511144",
                Sku = "DET-SRF-1KG"
            },
            new() {
                Name = "Lux Beauty Soap Rose 140g",
                UrduName = "لکس بیوٹی صابن ۱۴۰ گرام",
                RomanUrduName = "Lux Beauty Soap Rose Sabun Saban",
                CategoryId = catCleaning.Id,
                UnitType = UnitType.PIECE,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 160.00m,
                MinStockThreshold = 18m,
                CurrentStockBaseUnit = 50m,
                Barcode = "8964000511281",
                Sku = "SOP-LUX-140"
            },
            new() {
                Name = "Vim Dishwash Bar 300g",
                UrduName = "وم ڈش واش بار ۳۰۰ گرام",
                RomanUrduName = "Vim Bartan Dhone Wala Sabun Dishwash Bar",
                CategoryId = catCleaning.Id,
                UnitType = UnitType.PIECE,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 110.00m,
                MinStockThreshold = 12m,
                CurrentStockBaseUnit = 40m,
                Barcode = "8964000511990",
                Sku = "DSH-VIM-300"
            },
            new() {
                Name = "Sunsilk Black Shine Shampoo 180ml",
                UrduName = "سن سلک بلیک شائن شیمپو ۱۸۰ ملی لٹر",
                RomanUrduName = "Sunsilk Black Shine Shampoo",
                CategoryId = catPersonal.Id,
                UnitType = UnitType.PIECE,
                BaseUnitRatio = 1m,
                CurrentSellingPrice = 390.00m,
                MinStockThreshold = 8m,
                CurrentStockBaseUnit = 22m,
                Barcode = "8964000611002",
                Sku = "SHM-SUN-180"
            }
        };

        context.Products.AddRange(products);
        await context.SaveChangesAsync();

        // 5. Seed FIFO Inventory Batches demonstrating the exact user requirement
        // E.g. Rice: Batch A (20kg @ Rs.300/kg), Batch B (50kg @ Rs.325/kg), Selling price Rs.350/kg
        var basmatiRice = products.First(p => p.Sku == "RIC-BAS-001");
        var riceBatchA = new InventoryBatch
        {
            BatchNumber = "BATCH-RIC-20260901-A",
            ProductId = basmatiRice.Id,
            SupplierId = sup1.Id,
            InitialQuantityBaseUnit = 20000m, // 20kg in grams
            RemainingQuantityBaseUnit = 20000m,
            CostPricePerMajorUnit = 300.00m, // Rs. 300 / kg
            ReceivedDate = DateTime.UtcNow.AddDays(-5),
            Notes = "First shipment from Akbari Mandi"
        };

        var riceBatchB = new InventoryBatch
        {
            BatchNumber = "BATCH-RIC-20260903-B",
            ProductId = basmatiRice.Id,
            SupplierId = sup1.Id,
            InitialQuantityBaseUnit = 50000m, // 50kg in grams
            RemainingQuantityBaseUnit = 50000m,
            CostPricePerMajorUnit = 325.00m, // Rs. 325 / kg
            ReceivedDate = DateTime.UtcNow.AddDays(-2),
            Notes = "New shipment arrived at higher market cost"
        };

        // Also seed batches for other products
        var batches = new List<InventoryBatch>
        {
            riceBatchA,
            riceBatchB,
            new() {
                BatchNumber = "BATCH-SUG-20260901",
                ProductId = products.First(p => p.Sku == "SUG-WHT-001").Id,
                SupplierId = sup1.Id,
                InitialQuantityBaseUnit = 120000m,
                RemainingQuantityBaseUnit = 120000m,
                CostPricePerMajorUnit = 132.00m,
                ReceivedDate = DateTime.UtcNow.AddDays(-4)
            },
            new() {
                BatchNumber = "BATCH-DAL-20260902",
                ProductId = products.First(p => p.Sku == "DAL-CHA-001").Id,
                SupplierId = sup1.Id,
                InitialQuantityBaseUnit = 50000m,
                RemainingQuantityBaseUnit = 50000m,
                CostPricePerMajorUnit = 245.00m,
                ReceivedDate = DateTime.UtcNow.AddDays(-3)
            },
            new() {
                BatchNumber = "BATCH-OIL-20260902",
                ProductId = products.First(p => p.Sku == "OIL-MEZ-1L").Id,
                SupplierId = sup2.Id,
                InitialQuantityBaseUnit = 48m,
                RemainingQuantityBaseUnit = 48m,
                CostPricePerMajorUnit = 475.00m,
                ReceivedDate = DateTime.UtcNow.AddDays(-3)
            },
            new() {
                BatchNumber = "BATCH-TEA-20260901",
                ProductId = products.First(p => p.Sku == "TEA-TAP-400").Id,
                SupplierId = sup3.Id,
                InitialQuantityBaseUnit = 30m,
                RemainingQuantityBaseUnit = 30m,
                CostPricePerMajorUnit = 580.00m,
                ReceivedDate = DateTime.UtcNow.AddDays(-4)
            },
            new() {
                BatchNumber = "BATCH-SRF-20260902",
                ProductId = products.First(p => p.Sku == "DET-SRF-1KG").Id,
                SupplierId = sup2.Id,
                InitialQuantityBaseUnit = 35m,
                RemainingQuantityBaseUnit = 35m,
                CostPricePerMajorUnit = 550.00m,
                ReceivedDate = DateTime.UtcNow.AddDays(-3)
            },
            new() {
                BatchNumber = "BATCH-LUX-20260901",
                ProductId = products.First(p => p.Sku == "SOP-LUX-140").Id,
                SupplierId = sup2.Id,
                InitialQuantityBaseUnit = 50m,
                RemainingQuantityBaseUnit = 50m,
                CostPricePerMajorUnit = 135.00m,
                ReceivedDate = DateTime.UtcNow.AddDays(-4)
            }
        };

        context.InventoryBatches.AddRange(batches);

        // 6. Price History for Rice demonstrating price tracking
        context.PriceHistories.AddRange(
            new PriceHistory { ProductId = basmatiRice.Id, OldPrice = 340.00m, NewPrice = 350.00m, ChangedAt = DateTime.UtcNow.AddDays(-3), ChangedByUserId = owner.Id }
        );

        // 7. Seed Customers & Udhaar Ledgers
        var cust1 = new Customer { Name = "Haji Abdul Rehman (Mohalla Masjid)", Phone = "0300-5551122", Address = "Gali # 3, Main Bazaar", MaxCreditLimit = 30000m, CurrentBalance = 3850.00m };
        var cust2 = new Customer { Name = "Master Tariq (Govt High School)", Phone = "0312-9988776", Address = "Near Water Tank", MaxCreditLimit = 20000m, CurrentBalance = 1420.00m };
        var cust3 = new Customer { Name = "Rana Waqas (Tailor Master)", Phone = "0345-4433221", Address = "Shop # 12, Commercial Market", MaxCreditLimit = 15000m, CurrentBalance = 650.00m };

        context.Customers.AddRange(cust1, cust2, cust3);
        await context.SaveChangesAsync();

        // Customer ledger initial balances
        context.CustomerLedgers.AddRange(
            new CustomerLedger { CustomerId = cust1.Id, TransactionType = LedgerTransactionType.SaleDebit, Amount = 3850.00m, BalanceAfter = 3850.00m, Notes = "Monthly ration balance carried forward", CreatedByUserId = owner.Id, CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new CustomerLedger { CustomerId = cust2.Id, TransactionType = LedgerTransactionType.SaleDebit, Amount = 1420.00m, BalanceAfter = 1420.00m, Notes = "Grocery items credit", CreatedByUserId = owner.Id, CreatedAt = DateTime.UtcNow.AddDays(-2) },
            new CustomerLedger { CustomerId = cust3.Id, TransactionType = LedgerTransactionType.SaleDebit, Amount = 650.00m, BalanceAfter = 650.00m, Notes = "Sugar & Tea credit", CreatedByUserId = owner.Id, CreatedAt = DateTime.UtcNow.AddDays(-1) }
        );

        await context.SaveChangesAsync();
    }
}

