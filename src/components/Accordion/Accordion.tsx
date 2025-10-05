// src/components/Accordion/Accordion.tsx

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import styles from "./Accordion.module.css";
import React from "react";

type Item = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type AccordionProps = {
  items: Item[];
  defaultOpenId?: string;
};

export default function Accordion({ items, defaultOpenId }: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue={defaultOpenId}
      className={styles.accordionRoot}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.id}
          value={item.id}
          className={styles.accordionItem}
        >
          <AccordionPrimitive.Header className={styles.accordionHeader}>
            <AccordionPrimitive.Trigger className={styles.accordionTrigger}>
              <span>{item.title}</span>
              <ChevronDownIcon className={styles.chevron} aria-hidden />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className={styles.accordionContent}>
            <div className={styles.accordionInner}>{item.content}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
