import { UnitType } from '../types';

export interface KiryanaPreset {
  romanName: string;
  urduName: string;
  categoryName: string;
  unitType: UnitType;
  suggestedPrice: number;
}

export const KIRYANA_PRESETS: KiryanaPreset[] = [
  // Ration & Grains
  { romanName: 'Super Basmati Chawal', urduName: 'سپر باسمتی چاول', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 340 },
  { romanName: 'Kainat 1121 Steam Chawal', urduName: 'کائنات ۱۱۲۱ سٹیم چاول', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 370 },
  { romanName: 'Chakki Atta Gandum', urduName: 'چکی آٹا گندم', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 130 },
  { romanName: 'Safaid Cheeni (Sugar)', urduName: 'سفید چینی', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 145 },
  { romanName: 'Daal Chana Special', urduName: 'دال چنا خاص', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 280 },
  { romanName: 'Daal Moong Dhuli', urduName: 'دال مونگ دھلی', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 320 },
  { romanName: 'Daal Masoor Sabut', urduName: 'دال مسور ثابت', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 290 },
  { romanName: 'Daal Mash Dhuli', urduName: 'دال ماش دھلی', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 480 },
  { romanName: 'Khalis Besan', urduName: 'خالص بیسن', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 300 },
  { romanName: 'Maida Fine Flour', urduName: 'میدہ فائن', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 140 },
  { romanName: 'Sooji (Semolina)', urduName: 'سوجی', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 150 },
  { romanName: 'Safaid Chana Kabuli', urduName: 'سفید چنا کابلی', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 380 },
  { romanName: 'Kala Chana', urduName: 'کالا چنا', categoryName: 'General Ration', unitType: 'KG', suggestedPrice: 270 },

  // Ghee, Oils & Spices
  { romanName: 'Kisan Banaspati Ghee 1kg', urduName: 'کسان بناسپتی گھی ۱ کلو', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 520 },
  { romanName: 'Dalda Banaspati Ghee 1kg', urduName: 'ڈالڈا بناسپتی گھی ۱ کلو', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 540 },
  { romanName: 'Sufi Banaspati Ghee 1kg', urduName: 'صوفی بناسپتی گھی ۱ کلو', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 530 },
  { romanName: 'Habib Cooking Oil 1 Litre', urduName: 'حبیب کوکنگ آئل ۱ لٹر', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 550 },
  { romanName: 'Mezan Cooking Oil 1 Litre', urduName: 'میزان کوکنگ آئل ۱ لٹر', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 540 },
  { romanName: 'Sarson Ka Tel (Mustard Oil)', urduName: 'سرسوں کا خالص تیل', categoryName: 'Spices & Cooking', unitType: 'LITRE', suggestedPrice: 460 },
  { romanName: 'Shan Bombay Biryani Masala', urduName: 'شان بمبئی بریانی مصالحہ', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 130 },
  { romanName: 'Shan Sindhi Biryani Masala', urduName: 'شان سندھی بریانی مصالحہ', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 130 },
  { romanName: 'Shan Korma Masala', urduName: 'شان قورمہ مصالحہ', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 130 },
  { romanName: 'Shan Nihari Masala', urduName: 'شان نہاری مصالحہ', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 130 },
  { romanName: 'Shan Chaat Masala', urduName: 'شان چاٹ مصالحہ', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 110 },
  { romanName: 'National Iodized Namak 800g', urduName: 'نیشنل آیوڈائزڈ نمک', categoryName: 'Spices & Cooking', unitType: 'PACK', suggestedPrice: 65 },
  { romanName: 'Lal Mirch Powder', urduName: 'لال مرچ پاؤڈر خالص', categoryName: 'Spices & Cooking', unitType: 'KG', suggestedPrice: 900 },
  { romanName: 'Haldi Powder', urduName: 'ہلدی پاؤڈر خالص', categoryName: 'Spices & Cooking', unitType: 'KG', suggestedPrice: 750 },
  { romanName: 'Dhaniya Powder', urduName: 'دھنیا پاؤڈر', categoryName: 'Spices & Cooking', unitType: 'KG', suggestedPrice: 650 },
  { romanName: 'Safaid Zeera Sabut', urduName: 'سفید زیرہ ثابت', categoryName: 'Spices & Cooking', unitType: 'KG', suggestedPrice: 1800 },
  { romanName: 'Sabut Kali Mirch', urduName: 'کالی مرچ ثابت', categoryName: 'Spices & Cooking', unitType: 'KG', suggestedPrice: 2200 },

  // Tea, Beverages & Drinks
  { romanName: 'Tapal Danedar Chai 430g', urduName: 'ٹپال دانہ دار چائے ۴۳۰ گرام', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 680 },
  { romanName: 'Tapal Danedar Chai 190g', urduName: 'ٹپال دانہ دار چائے ۱۹۰ گرام', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 320 },
  { romanName: 'Tapal Family Mixture 380g', urduName: 'ٹپال فیملی مکسچر چائے', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 620 },
  { romanName: 'Lipton Yellow Label 380g', urduName: 'لپٹن یلو لیبل چائے', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 710 },
  { romanName: 'Supreme Tea 380g', urduName: 'سپریم چائے ۳۸۰ گرام', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 630 },
  { romanName: 'Rooh Afza Sharbat 800ml', urduName: 'روح افزا شربت ۸۰۰ ملی لٹر', categoryName: 'Snacks & Beverages', unitType: 'PIECE', suggestedPrice: 440 },
  { romanName: 'Jam-e-Shirin Sharbat 800ml', urduName: 'جام شیریں شربت', categoryName: 'Snacks & Beverages', unitType: 'PIECE', suggestedPrice: 430 },
  { romanName: 'Coca-Cola 1.5 Litre', urduName: 'کوکا کولا ۱.۵ لٹر', categoryName: 'Snacks & Beverages', unitType: 'PIECE', suggestedPrice: 180 },
  { romanName: 'Sprite 1.5 Litre', urduName: 'سپرائٹ ۱.۵ لٹر', categoryName: 'Snacks & Beverages', unitType: 'PIECE', suggestedPrice: 180 },
  { romanName: 'Nestle Pure Life Water 1.5L', urduName: 'نسلے منرل واٹر ۱.۵ لٹر', categoryName: 'Snacks & Beverages', unitType: 'PIECE', suggestedPrice: 110 },
  { romanName: 'Pakola Ice Cream Soda 1.5L', urduName: 'پاکولہ آئس کریم سوڈا', categoryName: 'Snacks & Beverages', unitType: 'PIECE', suggestedPrice: 170 },

  // Biscuits, Bakery & Snacks
  { romanName: 'Peek Freans Sooper Family Pack', urduName: 'سوپر بسکٹ فیملی پیک', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 140 },
  { romanName: 'LU Prince Chocolate Family Pack', urduName: 'پرنس بسکٹ فیملی پیک', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 140 },
  { romanName: 'Peek Freans Rio Biscuit Family', urduName: 'ریو بسکٹ فیملی پیک', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 130 },
  { romanName: 'LU Gala Biscuit Family Pack', urduName: 'گالا بسکٹ فیملی پیک', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 130 },
  { romanName: 'Lays Masala Potato Chips', urduName: 'لیز مصالحہ چپس', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 60 },
  { romanName: 'Lays French Cheese Chips', urduName: 'لیز فرینچ چیز چپس', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 60 },
  { romanName: 'Kurkure Chutney Chatpata', urduName: 'کرکرے چٹنی چٹ پٹا', categoryName: 'Snacks & Beverages', unitType: 'PACK', suggestedPrice: 60 },
  { romanName: 'Dawn Plain Bread Large', urduName: 'ڈان سادہ ڈبل روٹی بڑی', categoryName: 'Dairy & Bakery', unitType: 'PIECE', suggestedPrice: 170 },
  { romanName: 'Olpers Milk 1 Litre Tetra Pak', urduName: 'اولپرز دودھ ۱ لٹر', categoryName: 'Dairy & Bakery', unitType: 'PIECE', suggestedPrice: 290 },
  { romanName: 'Nestle Milkpak 1 Litre', urduName: 'ملک پیک دودھ ۱ لٹر', categoryName: 'Dairy & Bakery', unitType: 'PIECE', suggestedPrice: 290 },
  { romanName: 'Everyday Tea Whitener 375g', urduName: 'ایوری ڈے خشک دودھ', categoryName: 'Dairy & Bakery', unitType: 'PACK', suggestedPrice: 530 },

  // Soaps & Cleaning
  { romanName: 'Surf Excel 1kg Washing Powder', urduName: 'سرف ایکسل واشنگ پاؤڈر ۱ کلو', categoryName: 'Personal Care & Soap', unitType: 'PACK', suggestedPrice: 620 },
  { romanName: 'Ariel Detergent Powder 1kg', urduName: 'ایریل سرف ۱ کلو', categoryName: 'Personal Care & Soap', unitType: 'PACK', suggestedPrice: 590 },
  { romanName: 'Express Power Detergent 1kg', urduName: 'ایکسپریس پاور سرف ۱ کلو', categoryName: 'Personal Care & Soap', unitType: 'PACK', suggestedPrice: 380 },
  { romanName: 'Brite Total Detergent 1kg', urduName: 'برائیٹ سرف ۱ کلو', categoryName: 'Personal Care & Soap', unitType: 'PACK', suggestedPrice: 390 },
  { romanName: 'Lifebuoy Total Soap Red', urduName: 'لائف بوائے صابن', categoryName: 'Personal Care & Soap', unitType: 'PIECE', suggestedPrice: 110 },
  { romanName: 'Lux Beauty Soap 140g', urduName: 'لکس بیوٹی صابن', categoryName: 'Personal Care & Soap', unitType: 'PIECE', suggestedPrice: 145 },
  { romanName: 'Dettol Original Soap 110g', urduName: 'ڈیٹول اینٹی بیکٹیریل صابن', categoryName: 'Personal Care & Soap', unitType: 'PIECE', suggestedPrice: 150 },
  { romanName: 'Safeguard Soap Pure White', urduName: 'سیف گارڈ صابن', categoryName: 'Personal Care & Soap', unitType: 'PIECE', suggestedPrice: 140 },
  { romanName: 'Sunsilk Black Shine Shampoo 180ml', urduName: 'سن سلک شیمپو ۱۸۰ ملی', categoryName: 'Personal Care & Soap', unitType: 'PIECE', suggestedPrice: 380 },
  { romanName: 'Colgate Maximum Cavity Toothpaste', urduName: 'کولگیٹ ٹوتھ پیسٹ', categoryName: 'Personal Care & Soap', unitType: 'PIECE', suggestedPrice: 190 },
  { romanName: 'Vim Dishwash Bar Soap', urduName: 'وم برتن دھونے کا صابن', categoryName: 'Personal Care & Soap', unitType: 'PIECE', suggestedPrice: 80 },
  { romanName: 'Lemon Max Dishwash Bar', urduName: 'لیمن میکس بار', categoryName: 'Personal Care & Soap', unitType: 'PIECE', suggestedPrice: 75 }
];

const WORD_MAP: Record<string, string> = {
  chawal: 'چاول',
  rice: 'چاول',
  basmati: 'باسمتی',
  super: 'سپر',
  kainat: 'کائنات',
  atta: 'آٹا',
  gandum: 'گندم',
  chakki: 'چکی',
  cheeni: 'چینی',
  sugar: 'چینی',
  safaid: 'سفید',
  daal: 'دال',
  dal: 'دال',
  chana: 'چنا',
  moong: 'مونگ',
  masoor: 'مسور',
  mash: 'ماش',
  dhuli: 'دھلی',
  sabut: 'ثابت',
  besan: 'بیسن',
  maida: 'میدہ',
  sooji: 'سوجی',
  kala: 'کالا',
  ghee: 'گھی',
  banaspati: 'بناسپتی',
  tel: 'تیل',
  oil: 'آئل',
  sarson: 'سرسوں',
  cooking: 'کوکنگ',
  masala: 'مصالحہ',
  biryani: 'بریانی',
  korma: 'قورمہ',
  karahi: 'کڑاہی',
  nihari: 'نہاری',
  chaat: 'چاٹ',
  namak: 'نمک',
  salt: 'نمک',
  mirch: 'مرچ',
  lal: 'لال',
  haldi: 'ہلدی',
  dhaniya: 'دھنیا',
  zeera: 'زیرہ',
  kali: 'کالی',
  powder: 'پاؤڈر',
  kisan: 'کسان',
  dalda: 'ڈالڈا',
  sufi: 'صوفی',
  habib: 'حبیب',
  mezan: 'میزان',
  shan: 'شان',
  national: 'نیشنل',
  mehran: 'مہران',
  tapal: 'ٹپال',
  lipton: 'لپٹن',
  supreme: 'سپریم',
  olpers: 'اولپرز',
  nestle: 'نسلے',
  milkpak: 'ملک پیک',
  everyday: 'ایوری ڈے',
  rooh: 'روح',
  afza: 'افزا',
  coca: 'کوکا',
  cola: 'کولا',
  sprite: 'سپرائٹ',
  pakola: 'پاکولہ',
  sooper: 'سوپر',
  prince: 'پرنس',
  rio: 'ریو',
  gala: 'گالا',
  lays: 'لیز',
  kurkure: 'کرکرے',
  dawn: 'ڈان',
  surf: 'سرف',
  excel: 'ایکسل',
  ariel: 'ایریل',
  express: 'ایکسپریس',
  brite: 'برائیٹ',
  lifebuoy: 'لائف بوائے',
  lux: 'لکس',
  dettol: 'ڈیٹول',
  safeguard: 'سیف گارڈ',
  sunsilk: 'سن سلک',
  colgate: 'کولگیٹ',
  vim: 'وم',
  lemon: 'لیمن',
  max: 'میکس',
  chai: 'چائے',
  tea: 'چائے',
  doodh: 'دودھ',
  milk: 'دودھ',
  pani: 'پانی',
  water: 'پانی',
  biscuit: 'بسکٹ',
  chips: 'چپس',
  bread: 'ڈبل روٹی',
  sabun: 'صابن',
  soap: 'صابن',
  shampoo: 'شیمپو',
  toothpaste: 'ٹوتھ پیسٹ',
  special: 'خاص',
  khas: 'خاص',
  khalis: 'خالص',
  pure: 'خالص',
  pouch: 'پاؤچ',
  pack: 'پیک',
  family: 'فیملی',
  bottle: 'بوتل',
  kg: 'کلو',
  gm: 'گرام',
  gram: 'گرام',
  litre: 'لٹر'
};

export function autoGenerateUrdu(romanText: string): string {
  if (!romanText || !romanText.trim()) return '';

  const clean = romanText.trim();
  const exact = KIRYANA_PRESETS.find(
    (p) => p.romanName.toLowerCase() === clean.toLowerCase()
  );
  if (exact) return exact.urduName;

  const words = clean.split(/\s+/);
  const urduWords = words.map((w) => {
    const stripped = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (WORD_MAP[stripped]) {
      return WORD_MAP[stripped];
    }
    if (/^\d+$/.test(stripped)) {
      return w;
    }
    return w;
  });

  return urduWords.join(' ');
}
