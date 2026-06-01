"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "en" | "es";

const messages: Record<Locale, Record<string, string>> = {
  en: {
    // Nav
    "nav.pricing": "Pricing",
    "nav.signIn": "Sign in",
    "nav.studio": "Studio",

    // Landing — Hero
    "hero.badge": "For self-published authors",
    "hero.title": "Your Manuscript. A Real Audiobook.",
    "hero.subtitle": "Upload your book. AI narrates it with distinct character voices for $9.99. Listen below — every voice you hear was AI-generated.",
    "hero.description": "",
    "hero.cta": "Convert My Book",
    "hero.ctaSignedIn": "Open Studio",
    "hero.ctaSub": "Free sample first. No credit card. Download MP3, M4A, or FLAC.",
    "hero.oldCost": "$2,000–$5,000",
    "hero.oldCostLabel": "traditional narration",
    "hero.newCost": "$9.99",
    "hero.newCostLabel": "with Echoic",

    // Landing — Demo (Real Chapter)
    "demo.title": "Here's a real chapter Echoic generated",
    "demo.desc": "Three characters. Three voices. Auto-cast by AI in under 2 minutes — zero editing.",
    "demo.text": "\"The old man sat by the fire, his eyes fixed on the flickering flames. A sharp knock echoed through the empty hall. He rose slowly, gripping his cane. 'Who goes there?' he called out, his voice firm despite his age. 'I have not survived eighty winters to be frightened by shadows. Show yourself!' The door creaked open, letting in a gust of cold wind. A young woman stepped inside, brushing snow from her cloak. She lowered her hood, revealing bright eyes and a warm smile. 'It is I, grandfather. Your granddaughter. I have traveled far to find you. The fire is just as warm as I remember.' The old man stared at her for a long moment... then opened his arms, and she ran to him.\"",
    "demo.note": "Generated entirely by AI. Try it with your own paragraph below.",
    "demo.cast.label": "Voice cast",
    "demo.cast.narrator": "Narrator",
    "demo.cast.oldman": "The Old Man",
    "demo.cast.granddaughter": "The Granddaughter",

    // Landing — Where to Publish
    "publish.title": "Sell your audiobook anywhere",
    "publish.desc": "You own the file. Distribute it the way you sell your books.",
    "publish.platform.google": "Google Play Books",
    "publish.platform.apple": "Apple Books",
    "publish.platform.kobo": "Kobo",
    "publish.platform.spotify": "Spotify",
    "publish.platform.gumroad": "Gumroad",
    "publish.platform.direct": "Your own site",
    "publish.note": "Note: Audible / ACX currently restricts AI-narrated audiobooks. Most other platforms allow it — see FAQ.",

    // Landing — Founder
    "founder.message": "I'm Boyuan. I built Echoic because narrating an indie book costs $2,000+ — and most authors skip audio entirely. If you have a manuscript and want an audiobook this week, reply and tell me about your book. I read every email.",
    "founder.byline": "— Boyuan, founder",

    // Landing — How it Works
    "how.title": "How it works",
    "how.step1.title": "Upload your manuscript",
    "how.step1.desc": "Drop in a .txt, .pdf, .epub, .docx, or .mobi file — or just paste your text.",
    "how.step2.title": "AI reads & casts voices",
    "how.step2.desc": "AI analyzes your text, identifies every character, and assigns each one a unique voice that fits their personality.",
    "how.step3.title": "Download your audiobook",
    "how.step3.desc": "Get your finished audiobook in MP3, WAV, FLAC, or M4A — chapter by chapter or as one file.",

    // Landing — Social Proof (Stats)
    "proof.stat1.value": "26",
    "proof.stat1.label": "Languages",
    "proof.stat2.value": "30+",
    "proof.stat2.label": "AI voices",
    "proof.stat3.value": "< 5 min",
    "proof.stat3.label": "To finish a book",
    "proof.stat4.value": "$9.99",
    "proof.stat4.label": "Any length",

    // Landing — Try It
    "tryit.title": "Try it with your own text",
    "tryit.desc": "Paste a paragraph from your book and hear a sample instantly - no signup required.",
    "tryit.placeholder": "Paste a paragraph here... (e.g., the opening of your book)",
    "tryit.listen": "Listen",
    "tryit.generating": "Generating...",

    // Landing — Features
    "features.title": "Why authors pay for Echoic",
    "features.directed.title": "AI-Directed Narration",
    "features.directed.desc": "AI reads your text first and adds emotion, pacing, and dramatic beats — so the narration sounds natural, not robotic.",
    "features.casting.title": "Auto Character Casting",
    "features.casting.desc": "AI identifies every character in your book and assigns each one a unique voice that matches their personality.",
    "features.languages.title": "26 Languages",
    "features.languages.desc": "Generate audiobooks in English, Chinese, Spanish, French, Japanese, Korean, Hindi, and many more languages.",

    // Landing — CTA Banner
    "cta.title": "Ready to finish the full audiobook?",
    "cta.desc": "Start with a free sample. If the voice fits your book, unlock the full conversion for $9.99.",

    // FAQ
    "faq.title": "FAQ",
    "faq.publish.q": "Where can I publish my audiobook?",
    "faq.publish.a": "Your audiobook, your choice. Sell on your website, Gumroad, Google Play Books, Apple Books, Kobo, Spotify, or share directly with your readers. Please note that some platforms (e.g., Audible/ACX) may restrict AI-narrated content. Check each platform's policies before publishing.",
    "faq.own.q": "Do I own the audiobook?",
    "faq.own.a": "Yes. You retain full ownership of your manuscript and the generated audiobook. Echoic does not claim any rights to your content.",
    "faq.languages.q": "What languages are supported?",
    "faq.languages.a": "Echoic supports 26 languages including English, Chinese, Spanish, French, Japanese, Korean, Hindi, Arabic, Portuguese, Italian, Russian, and more. Each language has multiple voice options.",
    "faq.copyright.q": "Can I use copyrighted books?",
    "faq.copyright.a": "Echoic is designed for authors converting their own original works. You must have the rights to any content you upload. Do not upload copyrighted material you do not own or have permission to use.",

    "disclaimer": "Echoic provides AI-generated audio as a tool for content creators. The output is generated by third-party AI models and may contain imperfections. Echoic makes no guarantees regarding the suitability of generated audio for any specific platform or commercial purpose. Users are responsible for ensuring compliance with applicable laws, platform policies, and third-party rights before distributing generated content. By using Echoic, you confirm that you have the necessary rights to the content you upload.",

    "footer.tagline": "echoic.studio — AI-powered audiobook generation",
    "footer.privacy": "Privacy Policy",

    // Privacy
    "privacy.title": "Privacy Policy",
    "privacy.updated": "Last updated: April 30, 2026",
    "privacy.collect.title": "What We Collect",
    "privacy.collect.intro": "When you use Echoic, we may collect the following information:",
    "privacy.collect.account": "If you sign up via Clerk (our authentication provider), we receive your name and email address.",
    "privacy.collect.files": "Manuscripts you upload are processed to generate audiobooks. Files are not stored permanently and are deleted after processing.",
    "privacy.collect.payment": "Payments are handled by Stripe. We do not store your credit card details.",
    "privacy.collect.usage": "We collect anonymous usage metrics (page views, feature usage) through Vercel Analytics to improve the product. Vercel Analytics does not use cookies.",
    "privacy.cookies.title": "Cookies & Tracking",
    "privacy.cookies.pixel": "With your consent, we use the Meta Pixel (Facebook) to measure advertising effectiveness. The Meta Pixel places cookies on your device and may collect information about your browsing activity across websites.",
    "privacy.cookies.control": "You can accept or decline tracking cookies via the banner shown on your first visit. If you decline, the Meta Pixel will not be loaded and no tracking cookies will be set. You can change your preference at any time by clearing your browser's local storage for this site.",
    "privacy.thirdparty.title": "Third-Party Services",
    "privacy.thirdparty.intro": "We use the following third-party services to operate Echoic:",
    "privacy.thirdparty.each": "Each service has its own privacy policy governing how it handles your data.",
    "privacy.retention.title": "Data Retention",
    "privacy.retention.text": "Uploaded manuscripts and generated audio files are temporary and are not stored permanently. Account data is retained while your account is active. You can request deletion of your data by contacting us.",
    "privacy.contact.title": "Contact",
    "privacy.contact.text": "If you have questions about this privacy policy, contact us at",

    // Studio
    "studio.create": "Create an audiobook",
    "studio.noCredits": "You've used your free sample",
    "studio.noCredits.sub": "Purchase credits or subscribe to Pro to continue",
    "studio.viewPricing": "View Pricing",
    "studio.getCredits": "Get credits",
    "studio.language": "Language",
    "studio.narratorVoice": "Narrator voice",
    "studio.voiceHint": "Character voices are automatically cast by AI",
    "studio.showAllVoices": "Show all {count} voices",
    "studio.showFewer": "Show fewer voices",
    "studio.uploadFile": "Upload File",
    "studio.pasteText": "Paste Text",
    "studio.textPlaceholder": "Paste or type your text here...",
    "studio.words": "words",
    "studio.dropzone": "Drop your manuscript here, or click to browse",
    "studio.formats": ".txt, .pdf, .epub, .docx, .mobi, .azw3",
    "studio.previewVoice": "Preview Voice",
    "studio.generatingPreview": "Generating preview...",
    "studio.previewLabel": "Preview (first 30 seconds)",
    "studio.generate": "Generate Audiobook",
    "studio.uploading": "Uploading...",
    "studio.queued": "Queued...",
    "studio.directing": "Reading text & casting characters...",
    "studio.narrating": "Generating audio narration...",
    "studio.emailNotice": "We'll email you at {email} when it's ready. You can safely close this page.",
    "studio.cast": "Cast",
    "studio.chapters": "Chapters",
    "studio.chaptersDone": "({done}/{total} done)",
    "studio.ready": "Your audiobook is ready",
    "studio.voiceCast": "Voice Cast",
    "studio.format": "Format:",
    "studio.downloadFull": "Download Full Audiobook",
    "studio.download": "Download",
    "studio.convertAnother": "Convert another",
    "studio.failed": "Something went wrong",
    "studio.copyrightError": "This content was flagged as potentially copyrighted. Only original works can be converted. Your credit has not been consumed.",
    "studio.tryAgain": "Try again",
    "studio.refund": "Need a refund?",
    "studio.contactUs": "Contact us",
    "studio.history": "My Audiobooks",
    "studio.noAudiobooks": "No audiobooks yet. Create your first one!",
    "studio.delete": "Delete",
    "studio.deleteConfirm": "Are you sure you want to delete this audiobook? This cannot be undone.",
    "studio.freeConversion": "1 free sample",
    "studio.freeMode": "Free sample available",
    "studio.freeUsed": "Free sample used",
    "studio.freeLimit": "free sample limit: {count} words",
    "studio.fileFreeHint": "Free samples are limited to {count} words. Full books start at $9.99.",
    "studio.needsPaid": "This is longer than the free sample. Convert the full audiobook with a Single Book credit.",
    "studio.upgradeNow": "Unlock full book",
    "studio.upgradeToConvert": "Unlock Full Book",
    "studio.plan.free": "Your free sample is available",
    "studio.plan.freeDesc": "Generate one sample up to {count} words before paying.",
    "studio.plan.used": "Your free sample has been used",
    "studio.plan.usedDesc": "Full audiobook conversion starts at $9.99 with unlimited words.",
    "studio.plan.credit": "Single Book credit ready",
    "studio.plan.pro": "Pro plan active",
    "studio.plan.paidDesc": "You can convert full manuscripts with unlimited words.",
    "studio.credits": "{count} credit | {count} credits",
    "studio.pro": "Pro",
    "studio.preview": "Preview",
    "studio.stop": "Stop",
    "studio.play": "Play",
    "studio.hide": "Hide",

    // Email gate
    "studio.emailGate.title": "Enter your email to download",
    "studio.emailGate.desc": "We'll send you the download link — so you can access it anytime.",
    "studio.emailGate.placeholder": "your@email.com",
    "studio.emailGate.submit": "Get Download",
    "studio.emailGate.privacy": "No spam, ever. We only email you about your audiobooks.",
    "studio.emailGate.signIn": "Or sign in for the full experience",

    // Sign-in benefits
    "studio.signInBenefits.title": "Get more with a free account:",
    "studio.signInBenefits.history": "Save your audiobooks & re-download anytime",
    "studio.signInBenefits.email": "Get notified when long conversions finish",
    "studio.signInBenefits.priority": "Access conversion history across devices",
    "studio.signInBenefits.cta": "Create Free Account",

    "studio.status.done": "done",
    "studio.status.narrating": "narrating...",
    "studio.status.failed": "failed",
    "studio.status.pending": "pending",
    "studio.status.completed": "completed",

    // Pricing
    "pricing.title": "Simple pricing",
    "pricing.subtitle": "Pay only for what you need",
    "pricing.backToStudio": "Back to Studio",
  },
  es: {
    // Nav
    "nav.pricing": "Precios",
    "nav.signIn": "Iniciar sesión",
    "nav.studio": "Estudio",

    // Landing — Hero
    "hero.badge": "Para autores independientes",
    "hero.title": "Tu manuscrito. Un audiolibro real.",
    "hero.subtitle": "Sube tu libro. La IA lo narra con voces de personajes distintas por $9.99. Escucha abajo — todas las voces son generadas por IA.",
    "hero.description": "",
    "hero.cta": "Convertir Mi Libro",
    "hero.ctaSignedIn": "Abrir Estudio",
    "hero.ctaSub": "Muestra gratis primero. Sin tarjeta. Descarga MP3, M4A o FLAC.",
    "hero.oldCost": "$2,000–$5,000",
    "hero.oldCostLabel": "narración tradicional",
    "hero.newCost": "$9.99",
    "hero.newCostLabel": "con Echoic",

    // Landing — Demo (Capítulo Real)
    "demo.title": "Un capítulo real generado por Echoic",
    "demo.desc": "Tres personajes. Tres voces. Asignadas automáticamente por IA en menos de 2 minutos — sin edición.",
    "demo.text": "\"El viejo se sentó junto al fuego, con los ojos fijos en las llamas parpadeantes. Un golpe resonó en el salón vacío. Se levantó lentamente, agarrando su bastón. '¿Quién va?' gritó, con voz firme a pesar de su edad. 'No he sobrevivido ochenta inviernos para asustarme con sombras. ¡Muéstrate!' La puerta se abrió con un chirrido, dejando entrar una ráfaga de viento frío. Una joven entró, sacudiéndose la nieve de la capa. Bajó la capucha, revelando ojos brillantes y una cálida sonrisa. 'Soy yo, abuelo. Tu nieta. He viajado lejos para encontrarte. El fuego es tan cálido como lo recuerdo.' El viejo la miró un largo momento... luego abrió los brazos y ella corrió hacia él.\"",
    "demo.note": "Generado completamente por IA. Pruébalo con tu propio párrafo abajo.",
    "demo.cast.label": "Reparto de voces",
    "demo.cast.narrator": "Narrador",
    "demo.cast.oldman": "El Viejo",
    "demo.cast.granddaughter": "La Nieta",

    // Landing — Dónde Publicar
    "publish.title": "Vende tu audiolibro donde quieras",
    "publish.desc": "El archivo es tuyo. Distribúyelo como vendas tus libros.",
    "publish.platform.google": "Google Play Books",
    "publish.platform.apple": "Apple Books",
    "publish.platform.kobo": "Kobo",
    "publish.platform.spotify": "Spotify",
    "publish.platform.gumroad": "Gumroad",
    "publish.platform.direct": "Tu propio sitio",
    "publish.note": "Nota: Audible / ACX actualmente restringe audiolibros narrados por IA. La mayoría de otras plataformas lo permiten — ver FAQ.",

    // Landing — Fundador
    "founder.message": "Soy Boyuan. Construí Echoic porque narrar un libro indie cuesta $2,000+ — y la mayoría de autores omite el audio. Si tienes un manuscrito y quieres un audiolibro esta semana, respóndeme y cuéntame de tu libro. Leo todos los correos.",
    "founder.byline": "— Boyuan, fundador",

    // Landing — How it Works
    "how.title": "Cómo funciona",
    "how.step1.title": "Sube tu manuscrito",
    "how.step1.desc": "Arrastra un archivo .txt, .pdf, .epub, .docx o .mobi — o simplemente pega tu texto.",
    "how.step2.title": "La IA lee y asigna voces",
    "how.step2.desc": "La IA analiza tu texto, identifica cada personaje y asigna una voz única que se ajusta a su personalidad.",
    "how.step3.title": "Descarga tu audiolibro",
    "how.step3.desc": "Obtén tu audiolibro en MP3, WAV, FLAC o M4A — capítulo por capítulo o como un solo archivo.",

    // Landing — Social Proof (Estadísticas)
    "proof.stat1.value": "26",
    "proof.stat1.label": "Idiomas",
    "proof.stat2.value": "30+",
    "proof.stat2.label": "Voces de IA",
    "proof.stat3.value": "< 5 min",
    "proof.stat3.label": "Por libro",
    "proof.stat4.value": "$9.99",
    "proof.stat4.label": "Cualquier extensión",

    // Landing — Try It
    "tryit.title": "Pruébalo con tu propio texto",
    "tryit.desc": "Pega un párrafo de tu libro y escucha una muestra al instante - sin registro.",
    "tryit.placeholder": "Pega un párrafo aquí... (por ejemplo, el inicio de tu libro)",
    "tryit.listen": "Escuchar",
    "tryit.generating": "Generando...",

    // Landing — Features
    "features.title": "Por qué los autores pagan por Echoic",
    "features.directed.title": "Narración Dirigida por IA",
    "features.directed.desc": "Una IA lee tu texto primero y añade emoción, ritmo y momentos dramáticos — para que la narración suene natural, no robótica.",
    "features.casting.title": "Casting Automático",
    "features.casting.desc": "La IA identifica cada personaje de tu libro y asigna a cada uno una voz única que coincide con su personalidad.",
    "features.languages.title": "26 Idiomas",
    "features.languages.desc": "Genera audiolibros en español, inglés, chino, francés, japonés, coreano, hindi y muchos más idiomas.",

    // Landing — CTA Banner
    "cta.title": "¿Listo para terminar el audiolibro completo?",
    "cta.desc": "Empieza con una muestra gratis. Si la voz encaja con tu libro, desbloquea la conversión completa por $9.99.",

    // FAQ
    "faq.title": "Preguntas Frecuentes",
    "faq.publish.q": "¿Dónde puedo publicar mi audiolibro?",
    "faq.publish.a": "Tu audiolibro, tu elección. Véndelo en tu sitio web, Gumroad, Google Play Books, Apple Books, Kobo, Spotify, o compártelo directamente con tus lectores. Ten en cuenta que algunas plataformas (como Audible/ACX) pueden restringir contenido narrado por IA. Consulta las políticas de cada plataforma antes de publicar.",
    "faq.own.q": "¿Soy dueño del audiolibro?",
    "faq.own.a": "Sí. Conservas la propiedad total de tu manuscrito y del audiolibro generado. Echoic no reclama ningún derecho sobre tu contenido.",
    "faq.languages.q": "¿Qué idiomas son compatibles?",
    "faq.languages.a": "Echoic soporta 26 idiomas incluyendo español, inglés, chino, francés, japonés, coreano, hindi, árabe, portugués, italiano, ruso y más. Cada idioma tiene múltiples opciones de voz.",
    "faq.copyright.q": "¿Puedo usar libros con derechos de autor?",
    "faq.copyright.a": "Echoic está diseñado para autores que convierten sus propias obras originales. Debes tener los derechos de cualquier contenido que subas. No subas material con derechos de autor que no poseas o para el cual no tengas permiso de uso.",

    "disclaimer": "Echoic proporciona audio generado por IA como herramienta para creadores de contenido. La salida es generada por modelos de IA de terceros y puede contener imperfecciones. Echoic no garantiza la idoneidad del audio generado para ninguna plataforma o propósito comercial específico. Los usuarios son responsables de garantizar el cumplimiento de las leyes aplicables, las políticas de las plataformas y los derechos de terceros antes de distribuir contenido generado. Al usar Echoic, confirmas que tienes los derechos necesarios sobre el contenido que subes.",

    "footer.tagline": "echoic.studio — Generación de audiolibros con IA",
    "footer.privacy": "Política de Privacidad",

    // Privacy
    "privacy.title": "Política de Privacidad",
    "privacy.updated": "Última actualización: 30 de abril de 2026",
    "privacy.collect.title": "Qué Recopilamos",
    "privacy.collect.intro": "Cuando usas Echoic, podemos recopilar la siguiente información:",
    "privacy.collect.account": "Si te registras a través de Clerk (nuestro proveedor de autenticación), recibimos tu nombre y dirección de correo electrónico.",
    "privacy.collect.files": "Los manuscritos que subes se procesan para generar audiolibros. Los archivos no se almacenan permanentemente y se eliminan después del procesamiento.",
    "privacy.collect.payment": "Los pagos son gestionados por Stripe. No almacenamos los datos de tu tarjeta de crédito.",
    "privacy.collect.usage": "Recopilamos métricas de uso anónimas (vistas de página, uso de funciones) a través de Vercel Analytics para mejorar el producto. Vercel Analytics no utiliza cookies.",
    "privacy.cookies.title": "Cookies y Seguimiento",
    "privacy.cookies.pixel": "Con tu consentimiento, utilizamos el Meta Pixel (Facebook) para medir la efectividad publicitaria. El Meta Pixel coloca cookies en tu dispositivo y puede recopilar información sobre tu actividad de navegación en sitios web.",
    "privacy.cookies.control": "Puedes aceptar o rechazar las cookies de seguimiento a través del banner mostrado en tu primera visita. Si rechazas, el Meta Pixel no se cargará y no se establecerán cookies de seguimiento. Puedes cambiar tu preferencia en cualquier momento limpiando el almacenamiento local de tu navegador para este sitio.",
    "privacy.thirdparty.title": "Servicios de Terceros",
    "privacy.thirdparty.intro": "Utilizamos los siguientes servicios de terceros para operar Echoic:",
    "privacy.thirdparty.each": "Cada servicio tiene su propia política de privacidad que rige cómo maneja tus datos.",
    "privacy.retention.title": "Retención de Datos",
    "privacy.retention.text": "Los manuscritos subidos y los archivos de audio generados son temporales y no se almacenan permanentemente. Los datos de la cuenta se conservan mientras tu cuenta esté activa. Puedes solicitar la eliminación de tus datos contactándonos.",
    "privacy.contact.title": "Contacto",
    "privacy.contact.text": "Si tienes preguntas sobre esta política de privacidad, contáctanos en",

    // Studio
    "studio.create": "Crear un audiolibro",
    "studio.noCredits": "Ya usaste tu muestra gratis",
    "studio.noCredits.sub": "Compra créditos o suscríbete a Pro para continuar",
    "studio.viewPricing": "Ver Precios",
    "studio.getCredits": "Obtener créditos",
    "studio.language": "Idioma",
    "studio.narratorVoice": "Voz del narrador",
    "studio.voiceHint": "Las voces de personajes se asignan automáticamente por IA",
    "studio.showAllVoices": "Mostrar las {count} voces",
    "studio.showFewer": "Mostrar menos voces",
    "studio.uploadFile": "Subir Archivo",
    "studio.pasteText": "Pegar Texto",
    "studio.textPlaceholder": "Pega o escribe tu texto aquí...",
    "studio.words": "palabras",
    "studio.dropzone": "Arrastra tu manuscrito aquí, o haz clic para buscar",
    "studio.formats": ".txt, .pdf, .epub, .docx, .mobi, .azw3",
    "studio.previewVoice": "Preescuchar Voz",
    "studio.generatingPreview": "Generando preescucha...",
    "studio.previewLabel": "Preescucha (primeros 30 segundos)",
    "studio.generate": "Generar Audiolibro",
    "studio.uploading": "Subiendo...",
    "studio.queued": "En cola...",
    "studio.directing": "Leyendo texto y asignando personajes...",
    "studio.narrating": "Generando narración de audio...",
    "studio.emailNotice": "Te enviaremos un correo a {email} cuando esté listo. Puedes cerrar esta página.",
    "studio.cast": "Reparto",
    "studio.chapters": "Capítulos",
    "studio.chaptersDone": "({done}/{total} listos)",
    "studio.ready": "Tu audiolibro está listo",
    "studio.voiceCast": "Reparto de Voces",
    "studio.format": "Formato:",
    "studio.downloadFull": "Descargar Audiolibro Completo",
    "studio.download": "Descargar",
    "studio.convertAnother": "Convertir otro",
    "studio.failed": "Algo salió mal",
    "studio.copyrightError": "Este contenido fue marcado como potencialmente protegido por derechos de autor. Solo se pueden convertir obras originales. Tu crédito no ha sido consumido.",
    "studio.tryAgain": "Intentar de nuevo",
    "studio.refund": "¿Necesitas un reembolso?",
    "studio.contactUs": "Contáctanos",
    "studio.history": "Mis Audiolibros",
    "studio.noAudiobooks": "Aún no tienes audiolibros. ¡Crea el primero!",
    "studio.delete": "Eliminar",
    "studio.deleteConfirm": "¿Estás seguro de que deseas eliminar este audiolibro? Esta acción no se puede deshacer.",
    "studio.freeConversion": "1 muestra gratis",
    "studio.credits": "{count} crédito | {count} créditos",
    "studio.freeMode": "Muestra gratis disponible",
    "studio.freeUsed": "Muestra gratis usada",
    "studio.freeLimit": "límite de muestra gratis: {count} palabras",
    "studio.fileFreeHint": "Las muestras gratis están limitadas a {count} palabras. Los libros completos empiezan en $9.99.",
    "studio.needsPaid": "Este texto supera la muestra gratis. Convierte el audiolibro completo con un crédito de Single Book.",
    "studio.upgradeNow": "Desbloquear libro completo",
    "studio.upgradeToConvert": "Desbloquear Libro Completo",
    "studio.plan.free": "Tu muestra gratis está disponible",
    "studio.plan.freeDesc": "Genera una muestra de hasta {count} palabras antes de pagar.",
    "studio.plan.used": "Ya usaste tu muestra gratis",
    "studio.plan.usedDesc": "La conversión completa empieza en $9.99 con palabras ilimitadas.",
    "studio.plan.credit": "Crédito de Single Book disponible",
    "studio.plan.pro": "Plan Pro activo",
    "studio.plan.paidDesc": "Puedes convertir manuscritos completos con palabras ilimitadas.",
    "studio.pro": "Pro",
    "studio.preview": "Preescuchar",
    "studio.stop": "Detener",
    "studio.play": "Reproducir",
    "studio.hide": "Ocultar",

    // Email gate
    "studio.emailGate.title": "Ingresa tu email para descargar",
    "studio.emailGate.desc": "Te enviaremos el enlace de descarga para que puedas acceder en cualquier momento.",
    "studio.emailGate.placeholder": "tu@email.com",
    "studio.emailGate.submit": "Obtener Descarga",
    "studio.emailGate.privacy": "Sin spam, nunca. Solo te contactamos sobre tus audiolibros.",
    "studio.emailGate.signIn": "O inicia sesión para la experiencia completa",

    // Sign-in benefits
    "studio.signInBenefits.title": "Obtén más con una cuenta gratuita:",
    "studio.signInBenefits.history": "Guarda tus audiolibros y descárgalos cuando quieras",
    "studio.signInBenefits.email": "Recibe notificaciones cuando terminen las conversiones",
    "studio.signInBenefits.priority": "Accede a tu historial desde cualquier dispositivo",
    "studio.signInBenefits.cta": "Crear Cuenta Gratis",

    "studio.status.done": "listo",
    "studio.status.narrating": "narrando...",
    "studio.status.failed": "fallido",
    "studio.status.pending": "pendiente",
    "studio.status.completed": "completado",

    // Pricing
    "pricing.title": "Precios simples",
    "pricing.subtitle": "Paga solo por lo que necesitas",
    "pricing.backToStudio": "Volver al Estudio",
  },
};

type I18nContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && messages[stored]) {
      setLocale(stored);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "es") setLocale("es");
    }
  }, []);

  const changeLocale = (l: Locale) => {
    setLocale(l);
    localStorage.setItem("locale", l);
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    let text = messages[locale]?.[key] || messages.en[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
