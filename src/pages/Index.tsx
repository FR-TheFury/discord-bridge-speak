import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TranslatorPanel } from "@/components/TranslatorPanel";
import { NeonBubbles } from "@/components/NeonBubbles";
import { Helmet } from "react-helmet-async";
import { SettingsSheet } from "@/components/SettingsSheet";
import { useTranslation } from "react-i18next";
import { setUiLanguage } from "@/i18n";
const Index = () => {
  const { t, i18n } = useTranslation();
  const uiLangs = ["fr","en","es","de","it","pt","ru","zh","ja","ar","tr"];
  const currentUi = (i18n.language || "fr").split("-")[0];
  const display = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames([currentUi], { type: "language" }) : null;
  const labelFor = (code: string) => (display?.of(code) || ({ fr:"Français", en:"English", es:"Español", de:"Deutsch", it:"Italiano", pt:"Português", ru:"Русский", zh:"中文", ja:"日本語", ar:"العربية", tr:"Türkçe" } as Record<string,string>)[code] || code);
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
            <Select value={currentUi} onValueChange={(v) => setUiLanguage(v)}>
              <SelectTrigger aria-label={t("buttons.translateInterface")}>
                <SelectValue placeholder={t("buttons.translateInterface")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {uiLangs.map((c) => (
                  <SelectItem key={c} value={c}>{labelFor(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
