import React from "react";
import { Container, Box, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import styles from "./Hero.module.css";
import Buttons from "../Buttons";
import { useTranslation } from "react-i18next";
import { type Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";
import { AIRBNB_URL } from "../../lib/links";

export type HeroCTA = {
  label: string;
  href?: string;
  to?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

type ImageMedia = {
  type?: "image";
  src: string;
  alt?: string; // brug "" hvis rent dekorativt
};

type VideoMedia = {
  type: "video";
  src: string;
  alt?: string; // kort beskrivelse af videoindholdet
  poster?: string;
  loop?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
};

export type HeroMedia = ImageMedia | VideoMedia;

export type HeroProps = {
  title: string;
  subtitle?: string;
  badges?: string[];
  primaryCta?: HeroCTA; // optional (custom CTA)
  secondaryCta?: HeroCTA; // optional (custom CTA)
  layout?: "media-right" | "media-left";
  mediaAspect?: string; // fx "3 / 2" | "4 / 3" | "16 / 9"
  media?: HeroMedia;
  dense?: boolean;
  align?: "left" | "center";
  /** Valgfrit: giv sproget eksplicit. Ellers læses det fra i18n.language. */
  lang?: Lang;
};

type CSSVars = { ["--aspect"]?: string };

export default function Hero({
  title,
  subtitle,
  badges = [],
  primaryCta,
  secondaryCta,
  layout = "media-right",
  mediaAspect = "4 / 3",
  media,
  dense = false,
  align = "left",
  lang,
}: HeroProps) {
  const { i18n } = useTranslation();
  const currentLang: Lang =
    lang ?? (i18n.language?.toLowerCase().startsWith("da") ? "da" : "en");

  const rowClass = [
    styles.row,
    layout === "media-left" ? styles.mediaLeft : styles.mediaRight,
    align === "center" ? styles.center : "",
  ].join(" ");

  const frameStyle: React.CSSProperties & CSSVars = { ["--aspect"]: mediaAspect };

  /** Renders en CTA ud fra HeroCTA (når du overstyrer via props) */
  const CustomCTA = ({
    cta,
    variant,
  }: {
    cta?: HeroCTA;
    variant: "primary" | "secondary";
  }) => {
    if (!cta) return null;
    if (cta.to) {
      return (
        <Buttons
          variant={variant}
          label={cta.label}
          to={cta.to}
          onClick={cta.onClick}
          disabled={cta.disabled}
        />
      );
    }
    if (cta.href) {
      return (
        <Buttons
          variant={variant}
          label={cta.label}
          href={cta.href}
          external={cta.external}
          onClick={cta.onClick}
          disabled={cta.disabled}
        />
      );
    }
    // Fald tilbage til ren knap uden navigation
    return (
      <Buttons
        variant={variant}
        label={cta.label}
        onClick={cta.onClick}
        disabled={cta.disabled}
      />
    );
  };

  return (
    <Box asChild>
      <section className={[styles.wrapper, dense ? styles.dense : ""].join(" ")}>
        <Container size="3">
          <div className={rowClass}>
            {/* Tekstkolonne */}
            <div className={styles.copy}>
              {badges.length > 0 && (
                <Flex wrap="wrap" gap="2" className={styles.badges}>
                  {badges.map((b, i) => (
                    <Badge key={i} variant="soft" color="gray">
                      {b}
                    </Badge>
                  ))}
                </Flex>
              )}

              <Heading as="h1" size="8" trim="both">
                {title}
              </Heading>

              {subtitle && (
                <Text size="5" color="gray" className={styles.subtitle}>
                  {subtitle}
                </Text>
              )}

              {/* CTA’er */}
              <Flex gap="3" wrap="wrap" className={styles.ctas}>
                {primaryCta || secondaryCta ? (
                  <>
                    <CustomCTA cta={primaryCta} variant="primary" />
                    <CustomCTA cta={secondaryCta} variant="secondary" />
                  </>
                ) : (
                  <>
                    {/* Default CTA’er – tosprogede via Buttons */}
                    <Buttons
                      labelDa="Book via Airbnb"
                      labelEn="Book on Airbnb"
                      href={AIRBNB_URL}
                      external
                    />
                    <Buttons
                      variant="secondary"
                      labelDa="Se huset"
                      labelEn="See the house"
                      to={pathOf(currentLang, "house")}  
                    />
                  </>
                )}
              </Flex>
            </div>

            {/* Mediekolonne */}
            {media?.src && (
              <figure className={styles.mediaBox}>
                <div className={styles.mediaFrame} style={frameStyle}>
                  {media.type === "video" ? (
                    <video
                      className={styles.mediaEl}
                      src={media.src}
                      poster={media.poster}
                      autoPlay={media.autoPlay ?? false}
                      muted={media.muted ?? true}
                      loop={media.loop ?? false}
                      playsInline
                      controls={!media.autoPlay}
                      aria-label={media.alt}
                    />
                  ) : (
                    <img
                      className={styles.mediaEl}
                      src={media.src}
                      alt={media.alt ?? ""}
                      loading="eager"
                    />
                  )}
                </div>
              </figure>
            )}
          </div>
        </Container>
      </section>
    </Box>
  );
}
