import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import styles from "./Accordion.module.css";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

type Item = {
  id: string;
  title?: React.ReactNode;
  titleKey?: string;
  content?: React.ReactNode;
  contentKey?: string;
};

type AccordionProps = {
  items: Item[];
  defaultOpenId?: string;
  i18nNs?: string;
};

export default function Accordion({
  items,
  defaultOpenId,
  i18nNs = "common",
}: AccordionProps) {
  const { t } = useTranslation(i18nNs);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleValueChange = (value: string) => {
    const el = itemRefs.current[value];
    if (el) {
      const rect = el.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const offsetTop = rect.top + scrollTop - 80; // 80px offset for header

      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue={defaultOpenId}
      className={styles.accordionRoot}
      onValueChange={handleValueChange}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.id}
          value={item.id}
          className={styles.accordionItem}
          ref={(el) => {
            itemRefs.current[item.id] = el;
          }}
        >
          <AccordionPrimitive.Header className={styles.accordionHeader}>
            <AccordionPrimitive.Trigger className={styles.accordionTrigger}>
              <span>{item.titleKey ? t(item.titleKey) : item.title}</span>
              <ChevronDownIcon className={styles.chevron} aria-hidden />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className={styles.accordionContent}>
            <div className={styles.accordionInner}>
              {item.contentKey ? t(item.contentKey) : item.content}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
