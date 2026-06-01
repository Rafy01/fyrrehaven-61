import React from "react";
import { Container, Box, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import styles from "./Hero.module.css";
import Buttons from "../Buttons";
import { useTranslation } from "react-i18next";
import { type Lang } from "../../lib/lang";


export type HeroCTA = {
  label?: string;
  labelKey?: string;
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
  altKey?: string;
  title?: string; // valgfrit title-attribut
  titleKey?: string;
};

type VideoMedia = {
  type: "video";
  src: string;
  alt?: string; // kort beskrivelse af videoindholdet
  altKey?: string;
  poster?: string;
  loop?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
};

export type HeroMedia = ImageMedia | VideoMedia;

export type HeroProps = {
  title?: string;
  titleKey?: string;
  subtitle?: string;
  subtitleKey?: string;
  badges?: string[];
  badgeKeys?: string[];
  primaryCta?: HeroCTA; // optional (custom CTA)
  secondaryCta?: HeroCTA; // optional (custom CTA)
  layout?: "media-right" | "media-left";
  mediaAspect?: string; // fx "3 / 2" | "4 / 3" | "16 / 9"
  media?: HeroMedia;
  dense?: boolean;
  align?: "left" | "center";
  /** i18n namespace for titleKey/subtitleKey/badgeKeys/CTA/media keys */
  i18nNs?: string;
  /** Valgfrit: giv sproget eksplicit. Ellers læses det fra i18n.language. */
  lang?: Lang;
};

type CSSVars = { ["--aspect"]?: string };

export default function Hero({
  title,
  titleKey,
  subtitle,
  subtitleKey,
  badges = [],
  badgeKeys = [],
  primaryCta,
  secondaryCta,
  layout = "media-right",
  mediaAspect = "4 / 3",
  media,
  dense = false,
  align = "left",
  i18nNs = "common",
}: HeroProps) {
  const { t } = useTranslation(i18nNs);
  const heroTitle = titleKey ? t(titleKey) : title;
  const heroSubtitle = subtitleKey ? t(subtitleKey) : subtitle;
  const heroBadges = badgeKeys.length ? badgeKeys.map((key) => t(key)) : badges;
  const mediaAlt = media
    ? media.altKey
      ? t(media.altKey)
      : media.alt ?? ""
    : "";
  const imageTitle =
    media && media.type !== "video"
      ? media.titleKey
        ? t(media.titleKey)
        : media.title ?? ""
      : "";

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
    const label = cta.labelKey ? t(cta.labelKey) : cta.label ?? "";
    if (cta.to) {
      return (
        <Buttons
          variant={variant}
          label={label}
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
          label={label}
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
        label={label}
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
              {heroBadges.length > 0 && (
                <Flex wrap="wrap" gap="2" className={styles.badges}>
                  {heroBadges.map((b, i) => (
                    <Badge key={i} variant="soft" color="gray">
                      {b}
                    </Badge>
                  ))}
                </Flex>
              )}

              {heroTitle && (
                <Heading as="h1" size="8" trim="both">
                  {heroTitle}
                </Heading>
              )}

              {heroSubtitle && (
                <Text size="5" color="gray" className={styles.subtitle}>
                  {heroSubtitle}
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
                      aria-label={mediaAlt}
                    />
                  ) : (
                    <img
                      className={styles.mediaEl}
                      src={media.src}
                      alt={mediaAlt}
                      title={imageTitle}
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
