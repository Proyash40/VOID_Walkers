/* ==========================================================================
   Void Walkers — i18n
   Tiny dictionary-based translator (English / हिन्दी / বাংলা).
   Mark any element with data-i18n="key" (or data-i18n-placeholder /
   data-i18n-aria-label / data-i18n-title for attributes) and it is translated
   on load and whenever the language changes. Missing keys fall back to English.
   Add a language by adding one more object to DICT and one <label> in
   js/settings.js.
   ========================================================================== */

window.VW = window.VW || {};

(function () {
  const DICT = {
    en: {
      "meta.home": "Void Walkers — CTF Team",
      "meta.hierarchy": "Hierarchy — Void Walkers",
      "meta.contact": "Contact — Void Walkers",
      "meta.help": "Help — Void Walkers",
      "meta.database": "Database — Void Walkers",

      "nav.home": "Home", "nav.hierarchy": "Hierarchy", "nav.contact": "Contact", "nav.help": "Help", "nav.database": "Database",
      "nav.menu": "Toggle navigation menu", "nav.settings": "Open settings", "nav.sound": "Toggle background music", "nav.skip": "Skip to content",

      "hero.status": "Actively competing",
      "hero.sector": "Sector 00 — Void",
      "hero.subtitle": "A competitive Capture The Flag team working across web, pwn, reversing, crypto and forensics — building exploits, breaking assumptions, and climbing scoreboards together.",
      "hero.cta.events": "View event history",
      "hero.cta.contact": "Get in touch",
      "hero.hint": "Drag to tilt · Hold to feed the void",

      "members.title": "The crew",
      "members.desc": "Ordered by the community hierarchy — leadership first, then down through management, department heads, and team members.",
      "members.link": "Full hierarchy",
      "members.error.title": "Couldn't load the crew",
      "members.empty": "No members are listed yet. Check back soon.",

      "events.title": "Event database",
      "events.desc": "Every CTF the team has registered for, is currently running, or has completed.",
      "events.col.event": "Event", "events.col.format": "Format", "events.col.start": "Start date",
      "events.col.status": "Status", "events.col.rank": "Rank", "events.col.points": "Points",
      "events.status.upcoming": "Upcoming", "events.status.live": "Live", "events.status.concluded": "Concluded",
      "events.error.title": "Couldn't load events",
      "events.empty": "No events logged yet. Check back soon.",
      "events.untitled": "Untitled event",

      "contact.title": "Contact us",
      "contact.desc": "Interested in joining, sponsoring, or facing us in a competition? Send a message and we'll get back to you.",
      "contact.name": "Name", "contact.email": "Email", "contact.message": "Message",
      "contact.ph.name": "Ada Lovelace", "contact.ph.email": "ada@example.com", "contact.ph.message": "Tell us what's on your mind…",
      "contact.send": "Send message", "contact.sending": "Sending…",
      "contact.sent.title": "Message sent",
      "contact.sent.desc": "Thanks for reaching out — we typically reply within a couple of days.",
      "contact.err.name": "Enter your name.",
      "contact.err.email": "Enter a valid email address.",
      "contact.err.message": "Message should be at least 10 characters.",

      "help.title": "Help & FAQ",
      "help.desc": "Answers to the questions we get asked most about the team and how we operate.",

      "hierarchy.title": "Community management hierarchy",
      "hierarchy.desc": "How Void Walkers is organized, from founding leadership down to new members — and the access and responsibility that comes with each level.",
      "hierarchy.ladder.title": "Role progression ladder",
      "hierarchy.ladder.desc": "How team members (non-core) move up, based on tenure, engagement and contribution.",
      "hierarchy.access": "Access levels guide",
      "hierarchy.channels": "Channel access guide",
      "hierarchy.flow": "Feedback & communication flow",
      "hierarchy.key": "Key",
      "hierarchy.sponsors": "Sponsors & partners",
      "hierarchy.notes": "Important notes",
      "hierarchy.eligibility": "Leadership role eligibility",
      "hierarchy.principles": "Core principles",

      "settings.title": "Settings",
      "settings.close": "Close settings",
      "settings.language": "Language",
      "settings.music": "Background music",
      "settings.music.playing": "Playing",
      "settings.music.paused": "Paused",
      "settings.music.blocked": "Tap anywhere to start",
      "settings.music.error": "Audio file could not be loaded",
      "settings.volume": "Volume",
      "settings.mute": "Mute",
      "settings.accent": "Accent colour",
      "settings.accent.orange": "Orange", "settings.accent.teal": "Teal", "settings.accent.pink": "Pink",
      "settings.fx": "Visual effects",
      "settings.fx.full": "Full", "settings.fx.reduced": "Reduced",
      "settings.reset": "Reset to defaults",
      "settings.note": "Settings are saved on this device.",

      "common.error": "Unable to reach the server right now."
    },

    hi: {
      "meta.home": "Void Walkers — CTF टीम",
      "meta.hierarchy": "पदानुक्रम — Void Walkers",
      "meta.contact": "संपर्क — Void Walkers",
      "meta.help": "सहायता — Void Walkers",
      "meta.database": "डेटाबेस — Void Walkers",

      "nav.home": "होम", "nav.hierarchy": "पदानुक्रम", "nav.contact": "संपर्क", "nav.help": "सहायता", "nav.database": "डेटाबेस",
      "nav.menu": "नेविगेशन मेनू खोलें/बंद करें", "nav.settings": "सेटिंग्स खोलें", "nav.sound": "बैकग्राउंड म्यूज़िक चालू/बंद करें", "nav.skip": "सामग्री पर जाएँ",

      "hero.status": "सक्रिय रूप से प्रतिस्पर्धा में",
      "hero.sector": "सेक्टर 00 — वॉइड",
      "hero.subtitle": "वेब, pwn, रिवर्सिंग, क्रिप्टो और फॉरेंसिक्स में काम करने वाली एक प्रतिस्पर्धी कैप्चर द फ्लैग टीम — एक्सप्लॉइट बनाना, धारणाएँ तोड़ना और साथ मिलकर स्कोरबोर्ड पर आगे बढ़ना।",
      "hero.cta.events": "इवेंट इतिहास देखें",
      "hero.cta.contact": "संपर्क करें",
      "hero.hint": "झुकाने के लिए खींचें · होल को खिलाने के लिए दबाए रखें",

      "members.title": "क्रू",
      "members.desc": "सामुदायिक पदानुक्रम के अनुसार क्रमबद्ध — पहले नेतृत्व, फिर प्रबंधन, विभाग प्रमुख और टीम के सदस्य।",
      "members.link": "पूरा पदानुक्रम",
      "members.error.title": "क्रू लोड नहीं हो सका",
      "members.empty": "अभी कोई सदस्य सूचीबद्ध नहीं है। जल्द ही फिर देखें।",

      "events.title": "इवेंट डेटाबेस",
      "events.desc": "वे सभी CTF जिनके लिए टीम ने पंजीकरण किया है, जो चल रहे हैं या पूरे हो चुके हैं।",
      "events.col.event": "इवेंट", "events.col.format": "फ़ॉर्मैट", "events.col.start": "शुरू होने की तिथि",
      "events.col.status": "स्थिति", "events.col.rank": "रैंक", "events.col.points": "अंक",
      "events.status.upcoming": "आगामी", "events.status.live": "लाइव", "events.status.concluded": "समाप्त",
      "events.error.title": "इवेंट लोड नहीं हो सके",
      "events.empty": "अभी कोई इवेंट दर्ज नहीं है। जल्द ही फिर देखें।",
      "events.untitled": "बिना नाम का इवेंट",

      "contact.title": "हमसे संपर्क करें",
      "contact.desc": "जुड़ना चाहते हैं, प्रायोजक बनना चाहते हैं, या किसी प्रतियोगिता में हमारा सामना करना चाहते हैं? संदेश भेजें, हम आपसे संपर्क करेंगे।",
      "contact.name": "नाम", "contact.email": "ईमेल", "contact.message": "संदेश",
      "contact.ph.name": "आपका नाम", "contact.ph.email": "aap@example.com", "contact.ph.message": "अपना संदेश यहाँ लिखें…",
      "contact.send": "संदेश भेजें", "contact.sending": "भेजा जा रहा है…",
      "contact.sent.title": "संदेश भेज दिया गया",
      "contact.sent.desc": "संपर्क करने के लिए धन्यवाद — हम आमतौर पर कुछ दिनों में उत्तर देते हैं।",
      "contact.err.name": "अपना नाम दर्ज करें।",
      "contact.err.email": "मान्य ईमेल पता दर्ज करें।",
      "contact.err.message": "संदेश कम से कम 10 अक्षरों का होना चाहिए।",

      "help.title": "सहायता और FAQ",
      "help.desc": "टीम और हमारे काम करने के तरीके के बारे में सबसे अधिक पूछे जाने वाले प्रश्नों के उत्तर।",

      "hierarchy.title": "सामुदायिक प्रबंधन पदानुक्रम",
      "hierarchy.desc": "Void Walkers कैसे संगठित है — संस्थापक नेतृत्व से लेकर नए सदस्यों तक — और हर स्तर के साथ आने वाली पहुँच व ज़िम्मेदारी।",
      "hierarchy.ladder.title": "भूमिका प्रगति सीढ़ी",
      "hierarchy.ladder.desc": "टीम के सदस्य (नॉन-कोर) कार्यकाल, सहभागिता और योगदान के आधार पर कैसे आगे बढ़ते हैं।",
      "hierarchy.access": "पहुँच स्तर मार्गदर्शिका",
      "hierarchy.channels": "चैनल पहुँच मार्गदर्शिका",
      "hierarchy.flow": "फ़ीडबैक और संचार प्रवाह",
      "hierarchy.key": "संकेत",
      "hierarchy.sponsors": "प्रायोजक और भागीदार",
      "hierarchy.notes": "महत्वपूर्ण नोट्स",
      "hierarchy.eligibility": "नेतृत्व भूमिका पात्रता",
      "hierarchy.principles": "मूल सिद्धांत",

      "settings.title": "सेटिंग्स",
      "settings.close": "सेटिंग्स बंद करें",
      "settings.language": "भाषा",
      "settings.music": "बैकग्राउंड म्यूज़िक",
      "settings.music.playing": "चल रहा है",
      "settings.music.paused": "रुका हुआ",
      "settings.music.blocked": "शुरू करने के लिए कहीं भी टैप करें",
      "settings.music.error": "ऑडियो फ़ाइल लोड नहीं हो सकी",
      "settings.volume": "आवाज़",
      "settings.mute": "म्यूट",
      "settings.accent": "एक्सेंट रंग",
      "settings.accent.orange": "नारंगी", "settings.accent.teal": "टील", "settings.accent.pink": "गुलाबी",
      "settings.fx": "विज़ुअल इफ़ेक्ट्स",
      "settings.fx.full": "पूर्ण", "settings.fx.reduced": "कम",
      "settings.reset": "डिफ़ॉल्ट पर रीसेट करें",
      "settings.note": "सेटिंग्स इसी डिवाइस पर सहेजी जाती हैं।",

      "common.error": "अभी सर्वर से संपर्क नहीं हो पा रहा है।"
    },

    bn: {
      "meta.home": "Void Walkers — CTF টিম",
      "meta.hierarchy": "শ্রেণিবিন্যাস — Void Walkers",
      "meta.contact": "যোগাযোগ — Void Walkers",
      "meta.help": "সহায়তা — Void Walkers",
      "meta.database": "ডেটাবেস — Void Walkers",

      "nav.home": "হোম", "nav.hierarchy": "শ্রেণিবিন্যাস", "nav.contact": "যোগাযোগ", "nav.help": "সহায়তা", "nav.database": "ডেটাবেস",
      "nav.menu": "নেভিগেশন মেনু খুলুন/বন্ধ করুন", "nav.settings": "সেটিংস খুলুন", "nav.sound": "ব্যাকগ্রাউন্ড মিউজিক চালু/বন্ধ করুন", "nav.skip": "মূল বিষয়বস্তুতে যান",

      "hero.status": "সক্রিয়ভাবে প্রতিযোগিতায়",
      "hero.sector": "সেক্টর ০০ — ভয়েড",
      "hero.subtitle": "ওয়েব, pwn, রিভার্সিং, ক্রিপ্টো ও ফরেনসিক্সে কাজ করা একটি প্রতিযোগিতামূলক ক্যাপচার দ্য ফ্ল্যাগ টিম — এক্সপ্লয়েট তৈরি করা, ধারণা ভাঙা এবং একসঙ্গে স্কোরবোর্ডে এগিয়ে যাওয়া।",
      "hero.cta.events": "ইভেন্টের ইতিহাস দেখুন",
      "hero.cta.contact": "যোগাযোগ করুন",
      "hero.hint": "কাত করতে টানুন · ভয়েডকে খাওয়াতে চেপে ধরুন",

      "members.title": "ক্রু",
      "members.desc": "কমিউনিটির শ্রেণিবিন্যাস অনুযায়ী সাজানো — আগে নেতৃত্ব, তারপর ম্যানেজমেন্ট, বিভাগীয় প্রধান ও টিম সদস্য।",
      "members.link": "সম্পূর্ণ শ্রেণিবিন্যাস",
      "members.error.title": "ক্রু লোড করা যায়নি",
      "members.empty": "এখনও কোনো সদস্য তালিকাভুক্ত নেই। শীঘ্রই আবার দেখুন।",

      "events.title": "ইভেন্ট ডেটাবেস",
      "events.desc": "টিম যেসব CTF-এ নিবন্ধন করেছে, যেগুলো চলছে বা শেষ হয়েছে।",
      "events.col.event": "ইভেন্ট", "events.col.format": "ফরম্যাট", "events.col.start": "শুরুর তারিখ",
      "events.col.status": "অবস্থা", "events.col.rank": "র‍্যাংক", "events.col.points": "পয়েন্ট",
      "events.status.upcoming": "আসন্ন", "events.status.live": "লাইভ", "events.status.concluded": "সমাপ্ত",
      "events.error.title": "ইভেন্ট লোড করা যায়নি",
      "events.empty": "এখনও কোনো ইভেন্ট নথিভুক্ত নেই। শীঘ্রই আবার দেখুন।",
      "events.untitled": "নামহীন ইভেন্ট",

      "contact.title": "যোগাযোগ করুন",
      "contact.desc": "যোগ দিতে, স্পনসর করতে বা কোনো প্রতিযোগিতায় আমাদের মুখোমুখি হতে চান? একটি বার্তা পাঠান, আমরা আপনার সঙ্গে যোগাযোগ করব।",
      "contact.name": "নাম", "contact.email": "ইমেইল", "contact.message": "বার্তা",
      "contact.ph.name": "আপনার নাম", "contact.ph.email": "apni@example.com", "contact.ph.message": "আপনার বার্তা এখানে লিখুন…",
      "contact.send": "বার্তা পাঠান", "contact.sending": "পাঠানো হচ্ছে…",
      "contact.sent.title": "বার্তা পাঠানো হয়েছে",
      "contact.sent.desc": "যোগাযোগের জন্য ধন্যবাদ — আমরা সাধারণত কয়েক দিনের মধ্যে উত্তর দিই।",
      "contact.err.name": "আপনার নাম লিখুন।",
      "contact.err.email": "একটি সঠিক ইমেইল ঠিকানা লিখুন।",
      "contact.err.message": "বার্তাটি কমপক্ষে ১০ অক্ষরের হতে হবে।",

      "help.title": "সহায়তা ও FAQ",
      "help.desc": "টিম এবং আমাদের কাজের পদ্ধতি নিয়ে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্নের উত্তর।",

      "hierarchy.title": "কমিউনিটি ম্যানেজমেন্ট শ্রেণিবিন্যাস",
      "hierarchy.desc": "Void Walkers কীভাবে সংগঠিত — প্রতিষ্ঠাতা নেতৃত্ব থেকে নতুন সদস্য পর্যন্ত — এবং প্রতিটি স্তরের অ্যাক্সেস ও দায়িত্ব।",
      "hierarchy.ladder.title": "ভূমিকা অগ্রগতির সিঁড়ি",
      "hierarchy.ladder.desc": "টিম সদস্যরা (নন-কোর) মেয়াদ, সক্রিয়তা ও অবদানের ভিত্তিতে কীভাবে এগিয়ে যান।",
      "hierarchy.access": "অ্যাক্সেস স্তর নির্দেশিকা",
      "hierarchy.channels": "চ্যানেল অ্যাক্সেস নির্দেশিকা",
      "hierarchy.flow": "ফিডব্যাক ও যোগাযোগ প্রবাহ",
      "hierarchy.key": "সংকেত",
      "hierarchy.sponsors": "স্পনসর ও অংশীদার",
      "hierarchy.notes": "গুরুত্বপূর্ণ নোট",
      "hierarchy.eligibility": "নেতৃত্বের ভূমিকার যোগ্যতা",
      "hierarchy.principles": "মূল নীতি",

      "settings.title": "সেটিংস",
      "settings.close": "সেটিংস বন্ধ করুন",
      "settings.language": "ভাষা",
      "settings.music": "ব্যাকগ্রাউন্ড মিউজিক",
      "settings.music.playing": "চলছে",
      "settings.music.paused": "থামানো",
      "settings.music.blocked": "শুরু করতে যেকোনো জায়গায় ট্যাপ করুন",
      "settings.music.error": "অডিও ফাইল লোড করা যায়নি",
      "settings.volume": "ভলিউম",
      "settings.mute": "মিউট",
      "settings.accent": "অ্যাকসেন্ট রং",
      "settings.accent.orange": "কমলা", "settings.accent.teal": "টিল", "settings.accent.pink": "গোলাপি",
      "settings.fx": "ভিজ্যুয়াল ইফেক্ট",
      "settings.fx.full": "পূর্ণ", "settings.fx.reduced": "কম",
      "settings.reset": "ডিফল্টে রিসেট করুন",
      "settings.note": "সেটিংস এই ডিভাইসেই সংরক্ষিত থাকে।",

      "common.error": "এই মুহূর্তে সার্ভারের সঙ্গে সংযোগ করা যাচ্ছে না।"
    }
  };

  const SUPPORTED = Object.keys(DICT);
  let lang = "en";

  try {
    const saved = JSON.parse(localStorage.getItem("vw.settings") || "{}").lang;
    if (SUPPORTED.includes(saved)) lang = saved;
  } catch (e) { /* storage unavailable — stay on English */ }

  function t(key) {
    return (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder)); });
    scope.querySelectorAll("[data-i18n-aria-label]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => { el.setAttribute("title", t(el.dataset.i18nTitle)); });

    if (!root) {
      document.documentElement.lang = lang;
      const page = document.body && document.body.dataset.page;
      if (page && DICT.en["meta." + page]) document.title = t("meta." + page);
    }
  }

  function setLang(next) {
    if (!SUPPORTED.includes(next) || next === lang) return;
    lang = next;
    apply();
    document.dispatchEvent(new CustomEvent("vw:lang", { detail: { lang } }));
  }

  window.VW.i18n = { t, apply, setLang, get lang() { return lang; }, supported: SUPPORTED };

  document.addEventListener("DOMContentLoaded", () => apply());
})();
