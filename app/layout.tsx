import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

// ─── Font ─────────────────────────────────────────────────────────────────────
// next/font eliminates CLS by inlining the font-face declaration at build time
// and never making a runtime network request.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "DengueSense LK: Proactive Dengue Surveillance",
    template: "%s | DengueSense LK",
  },
  description:
    "Weekly dengue case intelligence and 4-week LSTM outbreak forecasting for Sri Lanka’s 26 RDHS divisions.",
  keywords: ["dengue", "surveillance", "Sri Lanka", "AI", "public health"],
  authors: [{ name: "Ministry of Health, DengueSense LK" }],
  openGraph: {
    type: "website",
    title: "DengueSense LK",
    description: "Weekly dengue case intelligence and 4-week LSTM forecasting for Sri Lanka.",
    siteName: "DengueSense LK",
  },
  twitter: {
    card: "summary",
    title: "DengueSense LK",
  },
};

// ─── Root Layout (Server Component) ──────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning>
        <Script id="strip-extension-attrs" strategy="beforeInteractive">
          {`(function(){
  var ATTR='bis_skin_checked';
  function strip(el){
    if(!el||el.nodeType!==1||!el.removeAttribute) return;
    if(el.hasAttribute&&el.hasAttribute(ATTR)) el.removeAttribute(ATTR);
  }
  function walk(node){
    strip(node);
    if(!node||!node.querySelectorAll) return;
    var list=node.querySelectorAll('['+ATTR+']');
    for(var i=0;i<list.length;i++) strip(list[i]);
  }
  var proto=Element.prototype;
  var orig=proto.setAttribute;
  proto.setAttribute=function(name,value){
    if(String(name).toLowerCase()===ATTR) return;
    return orig.call(this,name,value);
  };
  walk(document.documentElement);
  var obs=new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      var m=muts[i];
      if(m.type==='attributes') strip(m.target);
      for(var j=0;j<m.addedNodes.length;j++) walk(m.addedNodes[j]);
    }
  });
  obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:[ATTR]});
  document.addEventListener('DOMContentLoaded',function(){
    walk(document.documentElement);
    setTimeout(function(){ obs.disconnect(); }, 2500);
  });
})();`}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
