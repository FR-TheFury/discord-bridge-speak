import { Button } from "@/components/ui/button";
import { TranslatorPanel } from "@/components/TranslatorPanel";
import { NeonBubbles } from "@/components/NeonBubbles";
import { Helmet } from "react-helmet-async";
import { SettingsSheet } from "@/components/SettingsSheet";
import { useTranslation } from "react-i18next";
import { setUiLanguage } from "@/i18n";
const Index = () => {
  const { t, i18n } = useTranslation();
  const toggleUiLang = () => setUiLanguage(i18n.language?.startsWith("fr") ? "en" : "fr");
  return (
    <main className="min-h-screen neon-bg relative overflow-hidden">
      <Helmet>
        <html lang={i18n.language} />
        <title>{t("seo.title")}</title>
        <meta name="description" content={t("seo.description")} />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/"} />
      </Helmet>
      <NeonBubbles />
      <header className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl text-center animate-enter">
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-4 neon-text">
            {t("header.h1")}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {t("header.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="neon" asChild>
              <a href="#live">{t("buttons.startNow")}</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="#comment">{t("buttons.howItWorks")}</a>
            </Button>
            <Button variant="outline" onClick={toggleUiLang}>
              {t("buttons.translateInterface")}
            </Button>
            <SettingsSheet />
          </div>
        </div>
      </header>

      <section id="live" className="container pb-12 grid gap-6">
        <TranslatorPanel title={t("panel.title")} sourceLang="fr-FR" targetLang="en-US" />
      </section>

      <section id="comment" className="container pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold mb-3">{t("comment.title")}</h2>
          <p className="text-muted-foreground">
            {t("comment.text")}
          </p>
        </div>
      </section>
    </main>
  );
};

export default Index;
