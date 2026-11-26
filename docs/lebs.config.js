/*
 * LEBS CONFIG: the only file you edit to rebrand the store for a client.
 * Name, logo, colors, contact, delivery rules, categories and the whole catalog live here.
 * This is the DEMO config (a made-up store called "Zahra Studio").
 * See "Rebranding for a client" in the README.
 */
(function () {
  // Helper so the demo's "new arrivals" stay fresh. In a real config, write plain dates: added: "2026-11-20".
  function daysAgo(n) {
    var d = new Date(Date.now() - n * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  window.LEBS_CONFIG = {
    /* ---------- Brand ---------- */
    brand: {
      name: { en: 'Zahra Studio', ar: 'زهرة ستوديو' },
      tagline: { en: 'Everyday clothes, cut with care', ar: 'ملابس يومية بتفصيل مدروس' },
      logo: 'assets/logo.svg',          // path or URL. Square works best.
      favicon: 'assets/logo.svg'
    },

    /* ---------- Look ---------- */
    theme: {
      paper: '#F4EDE1',     // page background
      card: '#FBF7EF',      // tag / card background
      ink: '#1F1B16',       // text and dark surfaces
      accent: '#B54A27',    // buttons, highlights
      accent2: '#23423A',   // secondary (new arrivals, success)
      line: '#CDBFA8'       // stitch lines and borders
    },
    defaultLang: 'ar',      // 'ar' or 'en'

    /* ---------- Orders ---------- */
    whatsapp: {
      number: '201000000000',               // country code + number, digits only. DEMO number: replace it.
      defaultCountryCode: '20'              // added to customer numbers that start with 0
    },
    reservationHoldHours: 48,
    newArrivalsDays: 30,                    // how long a product counts as "new"
    currency: { code: 'EGP', symbol: { en: 'EGP', ar: 'ج.م' } },
    delivery: {
      fee: 60,
      freeOver: 1500,
      note: { en: 'Delivery inside Alexandria in 1 to 3 days.', ar: 'التوصيل داخل الإسكندرية خلال ١ إلى ٣ أيام.' }
    },
    sizeOrder: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'],

    /* ---------- Content ---------- */
    hero: {
      kicker: { en: 'Autumn 2026', ar: 'خريف ٢٠٢٦' },
      title: { en: 'Clothes you will actually wear.', ar: 'ملابس ستلبسها فعلاً.' },
      text: {
        en: 'Soft fabrics, honest prices, sizes that fit. Pick your size, send us the order on WhatsApp, and we take it from there.',
        ar: 'أقمشة ناعمة، أسعار صادقة، ومقاسات مضبوطة. اختر مقاسك وأرسل الطلب على واتساب ونكمل نحن الباقي.'
      }
    },
    about: {
      title: { en: 'About the studio', ar: 'عن الاستوديو' },
      text: {
        en: 'Zahra Studio is a small family atelier. We cut and sew in small batches, so a style can sell out. If your size is gone, message us and we will tell you when it is back.',
        ar: 'زهرة ستوديو ورشة عائلية صغيرة. نفصّل ونخيط على دفعات قليلة، لذلك قد ينفد موديل. إذا لم يتوفر مقاسك راسلنا ونخبرك متى يعود.'
      }
    },
    contact: {
      address: { en: '14 Sea Road, Alexandria', ar: '١٤ شارع البحر، الإسكندرية' },
      hours: { en: 'Daily 11:00 to 21:00, Friday 15:00 to 21:00', ar: 'يومياً من ١١ صباحاً إلى ٩ مساءً، الجمعة من ٣ عصراً' },
      instagram: ''                          // optional, e.g. 'zahrastudio'
    },
    perks: [
      { en: 'Reserve now, pay in store', ar: 'احجز الآن وادفع في المتجر' },
      { en: 'Cash on delivery', ar: 'الدفع عند الاستلام' },
      { en: 'Exchange within 7 days', ar: 'استبدال خلال ٧ أيام' }
    ],

    /* ---------- Catalog ---------- */
    categories: [
      { id: 'tops', name: { en: 'Tops', ar: 'بلوزات وقمصان' } },
      { id: 'dresses', name: { en: 'Dresses and abayas', ar: 'فساتين وعبايات' } },
      { id: 'bottoms', name: { en: 'Bottoms', ar: 'بناطيل وتنانير' } },
      { id: 'outer', name: { en: 'Outerwear', ar: 'جاكيتات' } },
      { id: 'extras', name: { en: 'Scarves', ar: 'أوشحة' } }
    ],

    // Colors a product can use. hex is the swatch and the color used for the drawn garment.
    palette: {
      ink:   { hex: '#26231F', en: 'Ink black', ar: 'أسود' },
      cream: { hex: '#EFE4CF', en: 'Cream', ar: 'كريمي' },
      sand:  { hex: '#CDB28A', en: 'Sand', ar: 'رملي' },
      clay:  { hex: '#B5543A', en: 'Clay', ar: 'قرميدي' },
      olive: { hex: '#6B7048', en: 'Olive', ar: 'زيتي' },
      sage:  { hex: '#A5B49C', en: 'Sage', ar: 'أخضر فاتح' },
      navy:  { hex: '#27365A', en: 'Navy', ar: 'كحلي' },
      rose:  { hex: '#D9A59B', en: 'Dusty rose', ar: 'وردي' },
      plum:  { hex: '#5E2F46', en: 'Plum', ar: 'برقوقي' }
    },

    /*
     * Products. Photos: add  images: ['photos/a.jpg', 'photos/b.jpg']  (paths or URLs) to show real photos.
     * Without images, the store draws the garment in each color (that is what this demo does).
     * sizes: { size: pieces in stock }. 0 shows "sold out" for that size.
     * art: garment shape used when no photos are given: tee, shirt, hoodie, dress, abaya, trousers, skirt, jacket, scarf.
     */
    products: [
      { id: 'linen-overshirt', art: 'shirt', category: 'tops', price: 890, added: daysAgo(2),
        name: { en: 'Linen overshirt', ar: 'قميص كتان واسع' },
        desc: { en: 'Washed linen with a relaxed cut. Wear it buttoned or open over a tee.', ar: 'كتان مغسول بقصة مريحة. البسه مقفولاً أو مفتوحاً فوق تيشيرت.' },
        colors: ['sand', 'sage', 'cream'], sizes: { S: 4, M: 6, L: 3, XL: 0 } },
      { id: 'heavy-tee', art: 'tee', category: 'tops', price: 340, added: daysAgo(4),
        name: { en: 'Heavy cotton tee', ar: 'تيشيرت قطن ثقيل' },
        desc: { en: '240 gsm combed cotton. Keeps its shape after the wash.', ar: 'قطن مسرّح ٢٤٠ جرام. يحافظ على شكله بعد الغسيل.' },
        colors: ['ink', 'cream', 'clay', 'olive'], sizes: { S: 8, M: 10, L: 9, XL: 5, XXL: 2 } },
      { id: 'zip-hoodie', art: 'hoodie', category: 'tops', price: 780, compareAt: 950, added: daysAgo(9),
        name: { en: 'Brushed zip hoodie', ar: 'هودي بسوستة' },
        desc: { en: 'Soft brushed inside, two deep pockets, metal zip.', ar: 'بطانة ناعمة، جيبان عميقان، سوستة معدن.' },
        colors: ['navy', 'ink', 'sand'], sizes: { S: 2, M: 5, L: 4, XL: 3 } },
      { id: 'garden-dress', art: 'dress', category: 'dresses', price: 1150, added: daysAgo(1),
        name: { en: 'Garden midi dress', ar: 'فستان ميدي' },
        desc: { en: 'Flowing midi length with a tie waist and side pockets.', ar: 'طول ميدي منسدل بحزام عند الخصر وجيوب جانبية.' },
        colors: ['rose', 'olive', 'plum'], sizes: { XS: 2, S: 5, M: 5, L: 2 } },
      { id: 'open-abaya', art: 'abaya', category: 'dresses', price: 1650, added: daysAgo(6),
        name: { en: 'Open crepe abaya', ar: 'عباية كريب مفتوحة' },
        desc: { en: 'Light crepe that drapes well. Open front, wide sleeves, one size fits 36 to 48.', ar: 'كريب خفيف ينسدل بجمال. أمامها مفتوح وأكمامها واسعة، مقاس واحد من ٣٦ إلى ٤٨.' },
        colors: ['ink', 'navy', 'sand'], sizes: { Free: 7 } },
      { id: 'shirt-dress', art: 'dress', category: 'dresses', price: 990, compareAt: 1250, added: daysAgo(40),
        name: { en: 'Poplin shirt dress', ar: 'فستان قميص بوبلين' },
        desc: { en: 'Crisp cotton poplin, button front, belt included.', ar: 'بوبلين قطن مقرمش، أزرار أمامية، الحزام مرفق.' },
        colors: ['cream', 'navy'], sizes: { S: 3, M: 4, L: 0 } },
      { id: 'wide-trousers', art: 'trousers', category: 'bottoms', price: 720, added: daysAgo(3),
        name: { en: 'Wide-leg trousers', ar: 'بنطلون واسع' },
        desc: { en: 'High waist, wide leg, hidden elastic at the back for comfort.', ar: 'خصر عالٍ وساق واسعة مع مطاط مخفي من الخلف للراحة.' },
        colors: ['ink', 'sand', 'olive'], sizes: { S: 3, M: 6, L: 6, XL: 2 } },
      { id: 'cargo-pants', art: 'trousers', category: 'bottoms', price: 840, added: daysAgo(18),
        name: { en: 'Soft cargo pants', ar: 'بنطلون كارجو' },
        desc: { en: 'Washed twill with four pockets and a tapered ankle.', ar: 'تويل مغسول بأربعة جيوب وأسفل ضيق قليلاً.' },
        colors: ['olive', 'ink', 'clay'], sizes: { S: 2, M: 4, L: 4, XL: 4 } },
      { id: 'pleated-skirt', art: 'skirt', category: 'bottoms', price: 650, added: daysAgo(12),
        name: { en: 'Pleated midi skirt', ar: 'جيبة بليسيه ميدي' },
        desc: { en: 'Permanent pleats that survive the washing machine.', ar: 'ثنيات ثابتة تتحمل الغسالة.' },
        colors: ['plum', 'sage', 'ink'], sizes: { XS: 1, S: 4, M: 5, L: 3 } },
      { id: 'denim-jacket', art: 'jacket', category: 'outer', price: 1350, added: daysAgo(22),
        name: { en: 'Boxy denim jacket', ar: 'جاكيت جينز واسع' },
        desc: { en: 'Heavy denim, boxy fit, copper buttons.', ar: 'جينز ثقيل بقصة واسعة وأزرار نحاسية.' },
        colors: ['navy', 'cream'], sizes: { S: 2, M: 3, L: 3, XL: 1 } },
      { id: 'quilted-jacket', art: 'jacket', category: 'outer', price: 1480, compareAt: 1800, added: daysAgo(55),
        name: { en: 'Quilted liner jacket', ar: 'جاكيت مبطن خفيف' },
        desc: { en: 'Light quilting for cool Alexandria evenings.', ar: 'تبطين خفيف لأمسيات الإسكندرية الباردة.' },
        colors: ['olive', 'ink'], sizes: { M: 2, L: 2 } },
      { id: 'cotton-scarf', art: 'scarf', category: 'extras', price: 260, added: daysAgo(5),
        name: { en: 'Cotton voile scarf', ar: 'وشاح قطن فويل' },
        desc: { en: 'Light, breathable and easy to pin. 180 x 70 cm.', ar: 'خفيف وقابل للتنفس وسهل التثبيت. ١٨٠ × ٧٠ سم.' },
        colors: ['rose', 'cream', 'sage', 'plum', 'ink'], sizes: { Free: 20 } },
      { id: 'knit-scarf', art: 'scarf', category: 'extras', price: 420, added: daysAgo(15),
        name: { en: 'Ribbed knit scarf', ar: 'وشاح تريكو' },
        desc: { en: 'Warm ribbed knit, soft on the neck.', ar: 'تريكو مضلع دافئ وناعم على الرقبة.' },
        colors: ['clay', 'navy', 'sand'], sizes: { Free: 6 } },
      { id: 'oxford-shirt', art: 'shirt', category: 'tops', price: 760, added: daysAgo(26),
        name: { en: 'Oxford shirt', ar: 'قميص أوكسفورد' },
        desc: { en: 'Classic oxford weave with a button-down collar.', ar: 'نسيج أوكسفورد كلاسيكي بياقة بأزرار.' },
        colors: ['cream', 'navy', 'rose'], sizes: { S: 3, M: 5, L: 5, XL: 2 } },
      { id: 'knit-tee', art: 'tee', category: 'tops', price: 480, added: daysAgo(0),
        name: { en: 'Fine knit top', ar: 'بلوزة تريكو ناعمة' },
        desc: { en: 'Fine-gauge knit with a clean neckline. Dresses up or down.', ar: 'تريكو رفيع بياقة بسيطة. يصلح للكاجوال والرسمي.' },
        colors: ['plum', 'cream', 'sage'], sizes: { S: 4, M: 6, L: 4 } },
      { id: 'night-abaya', art: 'abaya', category: 'dresses', price: 2100, added: daysAgo(34),
        name: { en: 'Embroidered evening abaya', ar: 'عباية سهرة مطرزة' },
        desc: { en: 'Soft black crepe with hand-finished cuffs.', ar: 'كريب أسود ناعم مع أساور بتشطيب يدوي.' },
        colors: ['ink', 'plum'], sizes: { Free: 3 } }
    ]
  };
})();
