import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import styles from "./Accordion.module.css";
import React, { useRef } from "react";

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
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleValueChange = (value: string) => {
    const el = itemRefs.current[value];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
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
