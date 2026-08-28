export const APP_PROMO_VIDEO_SRC = "/app-promo/preview.mp4";
export const APP_PROMO_VIDEO_WEBM_SRC = "/app-promo/preview.webm";
export const APP_ICON_SRC = "/app-promo/app-icon.png";

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  "https://play.google.com/store/search?q=DengueSense%20LK&c=apps";

export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL ??
  "https://apps.apple.com/search?term=DengueSense%20LK";

export type AppScreenshot = {
  src: string;
  alt: string;
  title: string;
  caption: string;
};

export const APP_SCREENSHOTS: AppScreenshot[] = [
  {
    src: "/app-promo/screenshots/splash.png",
    alt: "DengueSense LK splash screen with shield logo",
    title: "Open the app",
    caption: "Catch dengue early. Help your neighbours.",
  },
  {
    src: "/app-promo/screenshots/onboarding-help.png",
    alt: "Onboarding screen explaining how to report still water",
    title: "Help stop dengue early",
    caption: "See still water in a pot, tyre or drain? Take a photo.",
  },
  {
    src: "/app-promo/screenshots/onboarding-privacy.png",
    alt: "Privacy onboarding: no name and no login",
    title: "No name. No login.",
    caption: "We do not ask for your NIC or phone number.",
  },
  {
    src: "/app-promo/screenshots/onboarding-map.png",
    alt: "Onboarding preview of the dengue map and forecast",
    title: "See dengue near you",
    caption: "Check your district, see danger spots, keep your family safe.",
  },
  {
    src: "/app-promo/screenshots/home.png",
    alt: "Home screen greeting Ayubowan with weekly dengue stats",
    title: "Ayubowan",
    caption: "This week, this year, and danger spots in one glance.",
  },
  {
    src: "/app-promo/screenshots/report.png",
    alt: "Report screen for photographing still water",
    title: "Send a photo",
    caption: "Point at still water. We keep a secret code, not your name.",
  },
  {
    src: "/app-promo/screenshots/success.png",
    alt: "Confirmation screen after a photo is sent",
    title: "Photo sent. Thank you!",
    caption: "Track your report with a simple number like DS-0020.",
  },
  {
    src: "/app-promo/screenshots/map.png",
    alt: "Map of danger spots near the user",
    title: "Danger spots near you",
    caption: "High danger, take care, or safer. Colour you can trust.",
  },
  {
    src: "/app-promo/screenshots/news.png",
    alt: "District news screen for Colombo dengue trend",
    title: "How is your area?",
    caption: "Easy dengue news for your district, week by week.",
  },
  {
    src: "/app-promo/screenshots/news-forecast.png",
    alt: "Forecast chart of dengue cases for the coming weeks",
    title: "What may happen next",
    caption: "A simple look at cases now, and what may come next.",
  },
  {
    src: "/app-promo/screenshots/report-detail.png",
    alt: "Officer review of a still-water photo report",
    title: "Officers look at it",
    caption: "If it looks dangerous, your street hears it in plain words.",
  },
];

export const HERO_CYCLE_SRC = [
  "/app-promo/screenshots/home.png",
  "/app-promo/screenshots/report.png",
  "/app-promo/screenshots/map.png",
  "/app-promo/screenshots/news.png",
  "/app-promo/screenshots/success.png",
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "See still water",
    body: "A pot, a tyre, a tank, a drain. If water sits, mosquitoes can breed. That is the moment.",
  },
  {
    step: "02",
    title: "Take a photo",
    body: "Open the app, snap it, send it. A few seconds. No form. No NIC. No phone number.",
  },
  {
    step: "03",
    title: "Help your street",
    body: "Health teams see the pin. You get a number to track it. Neighbours get a safer lane.",
  },
] as const;
