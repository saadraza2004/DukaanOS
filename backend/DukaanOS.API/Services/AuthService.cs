using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DukaanOS.API.Core.Entities;
using DukaanOS.API.Core.Enums;
using DukaanOS.API.Data;
using DukaanOS.API.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DukaanOS.API.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<LoginResponse> RegisterStoreAsync(RegisterStoreRequest request);
    Task<UserDto?> GetCurrentUserAsync(int userId);
    Task<List<UserDto>> GetAllUsersAsync();
}

public class AuthService : IAuthService
{
    private readonly DukaanDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(DukaanDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Store)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower() && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        var token = GenerateJwtToken(user);
        var storeName = user.Store?.Name ?? "DukaanOS Store";
        var userDto = new UserDto(user.Id, user.Username, user.FullName, user.Role.ToString(), user.StoreId, storeName);
        return new LoginResponse(token, userDto);
    }

    public async Task<LoginResponse> RegisterStoreAsync(RegisterStoreRequest request)
    {
        var cleanUsername = request.Username.Trim().ToLower();
        var exists = await _db.Users.AnyAsync(u => u.Username.ToLower() == cleanUsername);
        if (exists)
        {
            throw new InvalidOperationException("Yeh username pehle se mojood hai. Barah-e-karam doosra muntakhib karein. (Username already taken)");
        }

        // 1. Create Store
        var store = new Store
        {
            Name = string.IsNullOrWhiteSpace(request.StoreName) ? "Meri Dukaan" : request.StoreName.Trim(),
            OwnerName = request.OwnerFullName.Trim(),
            Phone = request.Phone?.Trim(),
            City = string.IsNullOrWhiteSpace(request.City) ? "Pakistan" : request.City.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Stores.Add(store);
        await _db.SaveChangesAsync();

        // 2. Create Owner User
        var user = new User
        {
            StoreId = store.Id,
            Username = cleanUsername,
            FullName = string.IsNullOrWhiteSpace(request.OwnerFullName) ? "Dukaan Owner" : request.OwnerFullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.OWNER,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // 3. Seed Starter Categories for this store
        var starterCategories = new List<Category>
        {
            new() { StoreId = store.Id, Name = "General Ration (Galla / Daalein)", UrduName = "غلہ و راشن", DisplayOrder = 1 },
            new() { StoreId = store.Id, Name = "Spices & Cooking (Masalajat & Oil)", UrduName = "مصالحہ جات و گھی", DisplayOrder = 2 },
            new() { StoreId = store.Id, Name = "Snacks & Beverages", UrduName = "بسکٹ، چپس و مشروبات", DisplayOrder = 3 },
            new() { StoreId = store.Id, Name = "Dairy & Bakery", UrduName = "دودھ، ڈبل روٹی و بیکری", DisplayOrder = 4 },
            new() { StoreId = store.Id, Name = "Personal Care & Soap", UrduName = "صابن و صفائی اشیاء", DisplayOrder = 5 }
        };
        _db.Categories.AddRange(starterCategories);
        await _db.SaveChangesAsync();

        // 4. Seed 45+ Popular Pakistani Kiryana Products for this store
        var starterProducts = GetStarterProductsForStore(store.Id, starterCategories);
        _db.Products.AddRange(starterProducts);
        await _db.SaveChangesAsync();

        user.Store = store;
        var token = GenerateJwtToken(user);
        var userDto = new UserDto(user.Id, user.Username, user.FullName, user.Role.ToString(), store.Id, store.Name);
        return new LoginResponse(token, userDto);
    }

    private static List<Product> GetStarterProductsForStore(int storeId, List<Category> cats)
    {
        var catRation = cats[0].Id;
        var catCooking = cats[1].Id;
        var catSnacks = cats[2].Id;
        var catDairy = cats[3].Id;
        var catPersonal = cats[4].Id;

        return new List<Product>
        {
            // 1. General Ration
            new() { StoreId = storeId, Name = "Super Basmati Rice (Karnal)", UrduName = "سپر باسمتی چاول", RomanUrduName = "Super Basmati Chawal", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 340m, MinStockThreshold = 10m, CurrentStockBaseUnit = 50000m, Sku = "RIC-BAS-01" },
            new() { StoreId = storeId, Name = "Kainat 1121 Steam Rice", UrduName = "کائنات سٹیم چاول", RomanUrduName = "Kainat 1121 Steam Chawal", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 370m, MinStockThreshold = 10m, CurrentStockBaseUnit = 40000m, Sku = "RIC-KAI-02" },
            new() { StoreId = storeId, Name = "Chakki Atta Whole Wheat", UrduName = "چکی آٹا گندم", RomanUrduName = "Chakki Atta Gandum", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 130m, MinStockThreshold = 20m, CurrentStockBaseUnit = 100000m, Sku = "FLR-ATT-01" },
            new() { StoreId = storeId, Name = "White Sugar (Cheeni)", UrduName = "سفید چینی", RomanUrduName = "Safaid Cheeni Sugar", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 145m, MinStockThreshold = 25m, CurrentStockBaseUnit = 100000m, Sku = "SUG-WHT-01" },
            new() { StoreId = storeId, Name = "Daal Chana Special", UrduName = "دال چنا خاص", RomanUrduName = "Daal Chana Khas", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 280m, MinStockThreshold = 10m, CurrentStockBaseUnit = 30000m, Sku = "DAL-CHA-01" },
            new() { StoreId = storeId, Name = "Daal Moong Dhuli", UrduName = "دال مونگ دھلی", RomanUrduName = "Daal Moong Dhuli", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 320m, MinStockThreshold = 10m, CurrentStockBaseUnit = 25000m, Sku = "DAL-MOO-01" },
            new() { StoreId = storeId, Name = "Daal Masoor Sabut", UrduName = "دال مسور ثابت", RomanUrduName = "Daal Masoor Sabut", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 290m, MinStockThreshold = 10m, CurrentStockBaseUnit = 25000m, Sku = "DAL-MAS-01" },
            new() { StoreId = storeId, Name = "Daal Mash Dhuli", UrduName = "دال ماش دھلی", RomanUrduName = "Daal Mash Dhuli", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 480m, MinStockThreshold = 8m, CurrentStockBaseUnit = 20000m, Sku = "DAL-MSH-01" },
            new() { StoreId = storeId, Name = "Besan Pure Gram Flour", UrduName = "خالص بیسن", RomanUrduName = "Khalis Besan Flour", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 300m, MinStockThreshold = 10m, CurrentStockBaseUnit = 30000m, Sku = "FLR-BES-01" },
            new() { StoreId = storeId, Name = "Maida Fine Flour", UrduName = "میدہ فائن", RomanUrduName = "Maida Fine Flour", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 140m, MinStockThreshold = 10m, CurrentStockBaseUnit = 30000m, Sku = "FLR-MAI-01" },
            new() { StoreId = storeId, Name = "Sooji Semolina", UrduName = "سوجی", RomanUrduName = "Sooji Halwa", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 150m, MinStockThreshold = 10m, CurrentStockBaseUnit = 25000m, Sku = "SOJ-SEM-01" },
            new() { StoreId = storeId, Name = "Safaid Chana Kabuli", UrduName = "سفید چنا کابلی", RomanUrduName = "Safaid Chana Kabuli", CategoryId = catRation, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 380m, MinStockThreshold = 10m, CurrentStockBaseUnit = 30000m, Sku = "CHA-WHT-01" },

            // 2. Cooking & Spices
            new() { StoreId = storeId, Name = "Dalda Banaspati Ghee 1kg Pouch", UrduName = "ڈالڈا بناسپتی گھی ۱ کلو", RomanUrduName = "Dalda Banaspati Ghee 1kg", CategoryId = catCooking, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 540m, MinStockThreshold = 5m, CurrentStockBaseUnit = 24m, Sku = "GHE-DAL-01" },
            new() { StoreId = storeId, Name = "Kisan Banaspati Ghee 1kg Pouch", UrduName = "کسان بناسپتی گھی ۱ کلو", RomanUrduName = "Kisan Banaspati Ghee 1kg", CategoryId = catCooking, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 520m, MinStockThreshold = 5m, CurrentStockBaseUnit = 24m, Sku = "GHE-KIS-01" },
            new() { StoreId = storeId, Name = "Sufi Banaspati Ghee 1kg", UrduName = "صوفی بناسپتی گھی ۱ کلو", RomanUrduName = "Sufi Banaspati Ghee 1kg", CategoryId = catCooking, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 530m, MinStockThreshold = 5m, CurrentStockBaseUnit = 20m, Sku = "GHE-SUF-01" },
            new() { StoreId = storeId, Name = "Habib Cooking Oil 1 Litre", UrduName = "حبیب کوکنگ آئل ۱ لٹر", RomanUrduName = "Habib Cooking Oil 1L", CategoryId = catCooking, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 550m, MinStockThreshold = 5m, CurrentStockBaseUnit = 24m, Sku = "OIL-HAB-01" },
            new() { StoreId = storeId, Name = "Sarson Ka Tel (Mustard Oil)", UrduName = "سرسوں کا خالص تیل", RomanUrduName = "Sarson Ka Tel Mustard Oil", CategoryId = catCooking, UnitType = UnitType.LITRE, BaseUnitRatio = 1000m, CurrentSellingPrice = 460m, MinStockThreshold = 10m, CurrentStockBaseUnit = 30000m, Sku = "OIL-SAR-01" },
            new() { StoreId = storeId, Name = "Shan Bombay Biryani Masala", UrduName = "شان بمبئی بریانی مصالحہ", RomanUrduName = "Shan Bombay Biryani Masala", CategoryId = catCooking, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 130m, MinStockThreshold = 10m, CurrentStockBaseUnit = 36m, Sku = "MAS-SHN-01" },
            new() { StoreId = storeId, Name = "Shan Sindhi Biryani Masala", UrduName = "شان سندھی بریانی مصالحہ", RomanUrduName = "Shan Sindhi Biryani Masala", CategoryId = catCooking, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 130m, MinStockThreshold = 10m, CurrentStockBaseUnit = 36m, Sku = "MAS-SHN-02" },
            new() { StoreId = storeId, Name = "Shan Korma Masala", UrduName = "شان قورمہ مصالحہ", RomanUrduName = "Shan Korma Masala", CategoryId = catCooking, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 130m, MinStockThreshold = 10m, CurrentStockBaseUnit = 36m, Sku = "MAS-SHN-03" },
            new() { StoreId = storeId, Name = "National Iodized Salt 800g", UrduName = "نیشنل آیوڈائزڈ نمک", RomanUrduName = "National Namak Salt 800g", CategoryId = catCooking, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 65m, MinStockThreshold = 15m, CurrentStockBaseUnit = 50m, Sku = "SLT-NAT-01" },
            new() { StoreId = storeId, Name = "Lal Mirch Powder", UrduName = "لال مرچ پاؤڈر", RomanUrduName = "Lal Mirch Powder", CategoryId = catCooking, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 900m, MinStockThreshold = 5m, CurrentStockBaseUnit = 15000m, Sku = "SPC-MIR-01" },
            new() { StoreId = storeId, Name = "Haldi Powder", UrduName = "ہلدی پاؤڈر", RomanUrduName = "Haldi Turmeric Powder", CategoryId = catCooking, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 750m, MinStockThreshold = 5m, CurrentStockBaseUnit = 15000m, Sku = "SPC-HAL-01" },
            new() { StoreId = storeId, Name = "Dhaniya Powder", UrduName = "دھنیا پاؤڈر", RomanUrduName = "Dhaniya Coriander Powder", CategoryId = catCooking, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 650m, MinStockThreshold = 5m, CurrentStockBaseUnit = 15000m, Sku = "SPC-DHA-01" },
            new() { StoreId = storeId, Name = "Safaid Zeera Sabut", UrduName = "سفید زیرہ ثابت", RomanUrduName = "Safaid Zeera Cumin", CategoryId = catCooking, UnitType = UnitType.KG, BaseUnitRatio = 1000m, CurrentSellingPrice = 1800m, MinStockThreshold = 2m, CurrentStockBaseUnit = 8000m, Sku = "SPC-ZEE-01" },

            // 3. Snacks & Beverages
            new() { StoreId = storeId, Name = "Tapal Danedar Chai 430g", UrduName = "ٹپال دانہ دار چائے ۴۳۰ گرام", RomanUrduName = "Tapal Danedar Chai 430g", CategoryId = catSnacks, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 680m, MinStockThreshold = 5m, CurrentStockBaseUnit = 24m, Sku = "TEA-TAP-01" },
            new() { StoreId = storeId, Name = "Tapal Family Mixture 380g", UrduName = "ٹپال فیملی مکسچر چائے", RomanUrduName = "Tapal Family Mixture Chai", CategoryId = catSnacks, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 620m, MinStockThreshold = 5m, CurrentStockBaseUnit = 20m, Sku = "TEA-TAP-02" },
            new() { StoreId = storeId, Name = "Lipton Yellow Label 380g", UrduName = "لپٹن یلو لیبل چائے", RomanUrduName = "Lipton Yellow Label Tea", CategoryId = catSnacks, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 710m, MinStockThreshold = 5m, CurrentStockBaseUnit = 18m, Sku = "TEA-LIP-01" },
            new() { StoreId = storeId, Name = "Rooh Afza Sharbat 800ml", UrduName = "روح افزا شربت ۸۰۰ ملی لٹر", RomanUrduName = "Rooh Afza Sharbat 800ml", CategoryId = catSnacks, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 440m, MinStockThreshold = 5m, CurrentStockBaseUnit = 24m, Sku = "BEV-ROO-01" },
            new() { StoreId = storeId, Name = "Coca-Cola 1.5 Litre", UrduName = "کوکا کولا ۱.۵ لٹر", RomanUrduName = "Coca Cola Cold Drink 1.5L", CategoryId = catSnacks, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 180m, MinStockThreshold = 6m, CurrentStockBaseUnit = 30m, Sku = "BEV-COK-01" },
            new() { StoreId = storeId, Name = "Sprite 1.5 Litre", UrduName = "سپرائٹ ۱.۵ لٹر", RomanUrduName = "Sprite Cold Drink 1.5L", CategoryId = catSnacks, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 180m, MinStockThreshold = 6m, CurrentStockBaseUnit = 30m, Sku = "BEV-SPR-01" },
            new() { StoreId = storeId, Name = "Nestlé Pure Life Water 1.5L", UrduName = "نسلے منرل واٹر ۱.۵ لٹر", RomanUrduName = "Nestle Mineral Water 1.5L", CategoryId = catSnacks, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 110m, MinStockThreshold = 10m, CurrentStockBaseUnit = 36m, Sku = "WTR-NES-01" },
            new() { StoreId = storeId, Name = "Peek Freans Sooper Biscuit Family", UrduName = "سوپر بسکٹ فیملی پیک", RomanUrduName = "Sooper Biscuit Family Pack", CategoryId = catSnacks, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 140m, MinStockThreshold = 10m, CurrentStockBaseUnit = 36m, Sku = "BSC-SOP-01" },
            new() { StoreId = storeId, Name = "LU Prince Biscuit Family Pack", UrduName = "پرنس بسکٹ فیملی پیک", RomanUrduName = "Prince Chocolate Biscuit Family", CategoryId = catSnacks, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 140m, MinStockThreshold = 10m, CurrentStockBaseUnit = 36m, Sku = "BSC-PRN-01" },
            new() { StoreId = storeId, Name = "Peek Freans Rio Biscuit Family", UrduName = "ریو بسکٹ فیملی پیک", RomanUrduName = "Rio Cream Biscuit Family", CategoryId = catSnacks, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 130m, MinStockThreshold = 10m, CurrentStockBaseUnit = 30m, Sku = "BSC-RIO-01" },
            new() { StoreId = storeId, Name = "Lays Masala Chips Rs 60", UrduName = "لیز مصالحہ چپس", RomanUrduName = "Lays Masala Chips", CategoryId = catSnacks, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 60m, MinStockThreshold = 12m, CurrentStockBaseUnit = 48m, Sku = "CHP-LAY-01" },
            new() { StoreId = storeId, Name = "Kurkure Chutney Chatpata Rs 60", UrduName = "کرکرے چٹنی چٹ پٹا", RomanUrduName = "Kurkure Chutney Chatpata", CategoryId = catSnacks, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 60m, MinStockThreshold = 12m, CurrentStockBaseUnit = 48m, Sku = "CHP-KUR-01" },

            // 4. Dairy & Bakery
            new() { StoreId = storeId, Name = "Olper's Milk 1 Litre Tetra Pak", UrduName = "اولپرز دودھ ۱ لٹر", RomanUrduName = "Olpers Milk 1 Litre", CategoryId = catDairy, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 290m, MinStockThreshold = 12m, CurrentStockBaseUnit = 48m, Sku = "MLK-OLP-01" },
            new() { StoreId = storeId, Name = "Nestlé Everyday Tea Whitener 375g", UrduName = "ایوری ڈے خشک دودھ", RomanUrduName = "Nestle Everyday Powder Milk", CategoryId = catDairy, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 530m, MinStockThreshold = 5m, CurrentStockBaseUnit = 24m, Sku = "MLK-EVD-01" },
            new() { StoreId = storeId, Name = "Dawn Plain Bread Large", UrduName = "ڈان سادہ ڈبل روٹی بڑی", RomanUrduName = "Dawn Plain Bread Large", CategoryId = catDairy, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 170m, MinStockThreshold = 5m, CurrentStockBaseUnit = 20m, Sku = "BRD-DWN-01" },

            // 5. Personal Care & Soap
            new() { StoreId = storeId, Name = "Surf Excel 1kg Washing Powder", UrduName = "سرف ایکسل واشنگ پاؤڈر ۱ کلو", RomanUrduName = "Surf Excel 1kg", CategoryId = catPersonal, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 620m, MinStockThreshold = 6m, CurrentStockBaseUnit = 24m, Sku = "SRF-EXC-01" },
            new() { StoreId = storeId, Name = "Ariel Detergent Powder 1kg", UrduName = "ایریل سرف ۱ کلو", RomanUrduName = "Ariel Detergent 1kg", CategoryId = catPersonal, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 590m, MinStockThreshold = 6m, CurrentStockBaseUnit = 24m, Sku = "SRF-ARL-01" },
            new() { StoreId = storeId, Name = "Express Power Detergent 1kg", UrduName = "ایکسپریس پاور سرف ۱ کلو", RomanUrduName = "Express Power Detergent 1kg", CategoryId = catPersonal, UnitType = UnitType.PACK, BaseUnitRatio = 1m, CurrentSellingPrice = 380m, MinStockThreshold = 8m, CurrentStockBaseUnit = 30m, Sku = "SRF-EXP-01" },
            new() { StoreId = storeId, Name = "Lifebuoy Total Soap", UrduName = "لائف بوائے صابن", RomanUrduName = "Lifebuoy Soap Red", CategoryId = catPersonal, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 110m, MinStockThreshold = 10m, CurrentStockBaseUnit = 48m, Sku = "SOP-LIF-01" },
            new() { StoreId = storeId, Name = "Lux Beauty Soap 140g", UrduName = "لکس بیوٹی صابن", RomanUrduName = "Lux Beauty Soap", CategoryId = catPersonal, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 145m, MinStockThreshold = 10m, CurrentStockBaseUnit = 48m, Sku = "SOP-LUX-01" },
            new() { StoreId = storeId, Name = "Dettol Original Soap", UrduName = "ڈیٹول اینٹی بیکٹیریل صابن", RomanUrduName = "Dettol Original Soap", CategoryId = catPersonal, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 150m, MinStockThreshold = 10m, CurrentStockBaseUnit = 40m, Sku = "SOP-DET-01" },
            new() { StoreId = storeId, Name = "Sunsilk Black Shine Shampoo 180ml", UrduName = "سن سلک شیمپو ۱۸۰ ملی", RomanUrduName = "Sunsilk Shampoo Black 180ml", CategoryId = catPersonal, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 380m, MinStockThreshold = 5m, CurrentStockBaseUnit = 24m, Sku = "SHM-SUN-01" },
            new() { StoreId = storeId, Name = "Colgate Maximum Cavity Protection 75ml", UrduName = "کولگیٹ ٹوتھ پیسٹ", RomanUrduName = "Colgate Toothpaste 75ml", CategoryId = catPersonal, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 190m, MinStockThreshold = 6m, CurrentStockBaseUnit = 30m, Sku = "PST-COL-01" },
            new() { StoreId = storeId, Name = "Vim Dishwash Bar", UrduName = "وم برتن دھونے کا صابن", RomanUrduName = "Vim Dishwash Bar Soap", CategoryId = catPersonal, UnitType = UnitType.PIECE, BaseUnitRatio = 1m, CurrentSellingPrice = 80m, MinStockThreshold = 12m, CurrentStockBaseUnit = 60m, Sku = "VIM-BAR-01" }
        };
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users
            .Include(u => u.Store)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsActive) return null;
        var storeName = user.Store?.Name ?? "DukaanOS Store";
        return new UserDto(user.Id, user.Username, user.FullName, user.Role.ToString(), user.StoreId, storeName);
    }

    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        return await _db.Users
            .Include(u => u.Store)
            .Select(u => new UserDto(u.Id, u.Username, u.FullName, u.Role.ToString(), u.StoreId, u.Store != null ? u.Store.Name : "DukaanOS Store"))
            .ToListAsync();
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _config["Jwt:Key"] ?? "DukaanOS_SuperSecretProductionGradeJwtKey_2026_PakistaniRetailOS!#";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var storeName = user.Store?.Name ?? "DukaanOS Store";
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("FullName", user.FullName),
            new("StoreId", user.StoreId.ToString()),
            new("StoreName", storeName)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "DukaanOS.API",
            audience: _config["Jwt:Audience"] ?? "DukaanOS.Client",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(Convert.ToDouble(_config["Jwt:ExpiryDays"] ?? "30")),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

