/**
 * Latin → Urdu script transliteration for display purposes.
 *
 * Strategy:
 *  1. Look up each word in a curated dictionary of common Muslim / Pakistani names.
 *  2. Fall back to a rule-based phonetic mapper for unknown words.
 *
 * The result is approximate — perfect accuracy requires human curation, but this
 * covers the vast majority of names found in a Pakistani family tree.
 */

/* ------------------------------------------------------------------ */
/*  Dictionary – common first names, last names & titles              */
/* ------------------------------------------------------------------ */

const NAME_DICT: Record<string, string> = {
    /* ---- Male first names ---- */
    aaron: 'ہارون',
    abbas: 'عباس',
    abdul: 'عبد',
    abdulraheem: 'عبدالرحیم',
    abdurraheem: 'عبدالرحیم',
    abdulrahman: 'عبدالرحمٰن',
    abdurrahman: 'عبدالرحمٰن',
    abdullah: 'عبداللہ',
    adam: 'آدم',
    adeel: 'عدیل',
    adnan: 'عدنان',
    afzal: 'افضل',
    ahmed: 'احمد',
    ahmad: 'احمد',
    ahsan: 'احسن',
    ajmal: 'اجمل',
    akbar: 'اکبر',
    akram: 'اکرم',
    ali: 'علی',
    amir: 'عامر',
    amjad: 'امجد',
    anas: 'انس',
    anwar: 'انور',
    aqeel: 'عقیل',
    arif: 'عارف',
    arslan: 'ارسلان',
    asad: 'اسد',
    ashraf: 'اشرف',
    asif: 'آصف',
    aslam: 'اسلم',
    atif: 'عاطف',
    ayub: 'ایوب',
    azam: 'اعظم',
    azhar: 'اظہر',
    aziz: 'عزیز',
    babar: 'بابر',
    basit: 'باسط',
    bilal: 'بلال',
    danish: 'دانش',
    dawood: 'داؤد',
    ehsan: 'احسان',
    ejaz: 'اعجاز',
    fahad: 'فہد',
    faheem: 'فہیم',
    faisal: 'فیصل',
    faiz: 'فیض',
    farhan: 'فرحان',
    farid: 'فرید',
    farooq: 'فاروق',
    ghulam: 'غلام',
    habib: 'حبیب',
    hafiz: 'حافظ',
    haider: 'حیدر',
    hamid: 'حامد',
    hameed: 'حمید',
    hamza: 'حمزہ',
    haris: 'حارث',
    haroon: 'ہارون',
    hasan: 'حسن',
    hassan: 'حسان',
    hussain: 'حسین',
    husain: 'حسین',
    ibrahim: 'ابراہیم',
    idrees: 'ادریس',
    ijaz: 'اعجاز',
    ikram: 'اکرام',
    imran: 'عمران',
    inayat: 'عنایت',
    iqbal: 'اقبال',
    irfan: 'عرفان',
    ishaq: 'اسحاق',
    ismail: 'اسماعیل',
    javed: 'جاوید',
    junaid: 'جنید',
    kamran: 'کامران',
    kashif: 'کاشف',
    khalid: 'خالد',
    khalil: 'خلیل',
    liaqat: 'لیاقت',
    luqman: 'لقمان',
    mahmood: 'محمود',
    mahmud: 'محمود',
    majid: 'ماجد',
    majeed: 'مجید',
    malik: 'مالک',
    mansoor: 'منصور',
    masood: 'مسعود',
    moin: 'معین',
    moeen: 'معین',
    mudassar: 'مدثر',
    muhammad: 'محمد',
    mohammed: 'محمد',
    mohsin: 'محسن',
    mubarak: 'مبارک',
    mujahid: 'مجاہد',
    mukhtar: 'مختار',
    munir: 'منیر',
    murtaza: 'مرتضیٰ',
    musaddiq: 'مصدق',
    mushahid: 'مشاہد',
    musharraf: 'مشرف',
    muslim: 'مسلم',
    mustafa: 'مصطفیٰ',
    muzammil: 'مزمل',
    nabeel: 'نبیل',
    nadeem: 'ندیم',
    naeem: 'نعیم',
    nasir: 'ناصر',
    naveed: 'نوید',
    nawaz: 'نواز',
    nazir: 'نذیر',
    niaz: 'نیاز',
    nouman: 'نعمان',
    noman: 'نعمان',
    obaid: 'عبید',
    omar: 'عمر',
    umar: 'عمر',
    osama: 'اسامہ',
    owais: 'اویس',
    pervez: 'پرویز',
    qadir: 'قادر',
    qasim: 'قاسم',
    rafiq: 'رفیق',
    rahim: 'رحیم',
    raheem: 'رحیم',
    rahman: 'رحمٰن',
    raja: 'راجہ',
    rashid: 'راشد',
    rasheed: 'رشید',
    rauf: 'رؤف',
    raza: 'رضا',
    rizwan: 'رضوان',
    saad: 'سعد',
    sabir: 'صابر',
    sadiq: 'صادق',
    saeed: 'سعید',
    sajid: 'ساجد',
    sajjad: 'سجاد',
    saleem: 'سلیم',
    salman: 'سلمان',
    sami: 'سامی',
    sarfraz: 'سرفراز',
    shahbaz: 'شہباز',
    shahid: 'شاہد',
    shakeel: 'شکیل',
    shakir: 'شاکر',
    shamim: 'شمیم',
    shams: 'شمس',
    sharif: 'شریف',
    shoaib: 'شعیب',
    sohail: 'سہیل',
    suleman: 'سلیمان',
    sulaiman: 'سلیمان',
    sultan: 'سلطان',
    tahir: 'طاہر',
    talha: 'طلحہ',
    tanveer: 'تنویر',
    tariq: 'طارق',
    usman: 'عثمان',
    waheed: 'وحید',
    wajid: 'واجد',
    waleed: 'ولید',
    waqar: 'وقار',
    waqas: 'وقاص',
    waseem: 'وسیم',
    yasir: 'یاسر',
    yousuf: 'یوسف',
    yusuf: 'یوسف',
    zafar: 'ظفر',
    zahid: 'زاہد',
    zaheer: 'ظہیر',
    zaid: 'زید',
    zakariya: 'زکریا',
    zaman: 'زمان',
    zameer: 'ضمیر',
    zubair: 'زبیر',

    /* ---- Female first names ---- */
    aisha: 'عائشہ',
    ayesha: 'عائشہ',
    amina: 'آمنہ',
    amna: 'آمنہ',
    anum: 'انعم',
    asma: 'اسماء',
    bushra: 'بشریٰ',
    farah: 'فرح',
    fatima: 'فاطمہ',
    fizza: 'فضہ',
    gulshan: 'گلشن',
    habiba: 'حبیبہ',
    hafsa: 'حفصہ',
    hina: 'حنا',
    hira: 'حرا',
    iqra: 'اقراء',
    javeria: 'جویریہ',
    khadija: 'خدیجہ',
    madiha: 'مدیحہ',
    mahira: 'ماہرہ',
    malika: 'ملکہ',
    manaurah: 'منورہ',
    maryam: 'مریم',
    mehnaz: 'مہناز',
    nadia: 'نادیہ',
    naila: 'نائلہ',
    nasreen: 'نسرین',
    nazia: 'نازیہ',
    nida: 'ندا',
    rabia: 'رابعہ',
    razia: 'رضیہ',
    rehana: 'ریحانہ',
    rukhsana: 'رخسانہ',
    sadiya: 'صادیہ',
    safia: 'صفیہ',
    saima: 'صائمہ',
    sajida: 'ساجدہ',
    sakina: 'سکینہ',
    salma: 'سلمیٰ',
    samina: 'سمینہ',
    sana: 'ثناء',
    shabana: 'شبانہ',
    shazia: 'شازیہ',
    sobia: 'صوبیہ',
    sumera: 'سمیرا',
    tahira: 'طاہرہ',
    uzma: 'عظمیٰ',
    yasmin: 'یاسمین',
    zainab: 'زینب',
    zubaida: 'زبیدہ',
    zuhra: 'زہرا',

    /* ---- Common surnames / family names / titles ---- */
    khan: 'خان',
    shah: 'شاہ',
    mirza: 'مرزا',
    butt: 'بٹ',
    chaudhry: 'چوہدری',
    chaudhary: 'چوہدری',
    sheikh: 'شیخ',
    shaikh: 'شیخ',
    qureshi: 'قریشی',
    syed: 'سید',
    hashmi: 'ہاشمی',
    kazmi: 'کاظمی',
    naqvi: 'نقوی',
    bukhari: 'بخاری',
    gillani: 'گیلانی',
    jilani: 'جیلانی',
    awan: 'اعوان',
    abbasi: 'عباسی',
    ansari: 'انصاری',
    bhatti: 'بھٹی',
    mughal: 'مغل',
    patel: 'پٹیل',
    rajput: 'راجپوت',
    rana: 'رانا',
    siddiqui: 'صدیقی',
    siddiqi: 'صدیقی',
    durrani: 'درانی',
    lodhi: 'لودھی',
    niazi: 'نیازی',
    afridi: 'آفریدی',
    yousafzai: 'یوسفزئی',
    khattak: 'خٹک',
    bangash: 'بنگش',
    marwat: 'مروت',
    orakzai: 'اورکزئی',
    shinwari: 'شنواری',
    mohmand: 'مہمند',
    swati: 'سواتی',
    tanoli: 'تنولی',
    jadoon: 'جدون',
    gujjar: 'گوجر',
    arain: 'آرائیں',
    jatt: 'جٹ',
};

/* ------------------------------------------------------------------ */
/*  Phonetic fallback mapper                                          */
/* ------------------------------------------------------------------ */

/** Digraphs checked before single characters (order matters) */
const DIGRAPHS: [string, string][] = [
    ['sh', 'ش'],
    ['kh', 'خ'],
    ['gh', 'غ'],
    ['ch', 'چ'],
    ['th', 'ث'],
    ['ph', 'ف'],
    ['zh', 'ژ'],
    ['aa', 'ا'],
    ['ee', 'ی'],
    ['oo', 'و'],
    ['ai', 'ائ'],
    ['au', 'او'],
];

const SINGLES: Record<string, string> = {
    a: 'ا',
    b: 'ب',
    c: 'ک',
    d: 'د',
    e: 'ی',
    f: 'ف',
    g: 'گ',
    h: 'ہ',
    i: 'ی',
    j: 'ج',
    k: 'ک',
    l: 'ل',
    m: 'م',
    n: 'ن',
    o: 'و',
    p: 'پ',
    q: 'ق',
    r: 'ر',
    s: 'س',
    t: 'ت',
    u: 'و',
    v: 'و',
    w: 'و',
    x: 'کس',
    y: 'ی',
    z: 'ز',
};

/**
 * Phonetically transliterate a single word (no spaces) from Latin to
 * approximate Urdu script. This is a best-effort fallback — the dictionary
 * lookup should handle the common cases.
 */
function phoneticTransliterate(word: string): string {
    const lower = word.toLowerCase();
    let result = '';
    let i = 0;

    while (i < lower.length) {
        // Try digraphs first
        if (i + 1 < lower.length) {
            const pair = lower[i] + lower[i + 1];
            const match = DIGRAPHS.find(([d]) => d === pair);
            if (match) {
                result += match[1];
                i += 2;
                continue;
            }
        }

        // Single character
        const ch = lower[i];
        result += SINGLES[ch] ?? ch; // keep unknown chars as-is
        i += 1;
    }

    return result;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Transliterate a single word (name part) to Urdu script.
 * Tries dictionary first, falls back to phonetic mapping.
 */
function transliterateWord(word: string): string {
    const key = word.toLowerCase().trim();
    if (!key) return '';
    return NAME_DICT[key] ?? phoneticTransliterate(key);
}

/**
 * Transliterate a full name (may contain spaces) to Urdu script.
 *
 * @example
 *   toUrdu('Azhar')       // → 'اظہر'
 *   toUrdu('Muhammad Ali') // → 'محمد علی'
 */
export function toUrdu(name: string): string {
    if (!name) return '';
    return name
        .split(/\s+/)
        .map(transliterateWord)
        .join(' ');
}
