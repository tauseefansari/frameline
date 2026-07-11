"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslations } from "next-intl";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";

interface HomeFaqProps {
  reduced: boolean;
}

const faqIds = [
  { q: "faq.q1" as const, a: "faq.a1" as const },
  { q: "faq.q2" as const, a: "faq.a2" as const },
  { q: "faq.q3" as const, a: "faq.a3" as const },
  { q: "faq.q4" as const, a: "faq.a4" as const },
];

export function HomeFaq({ reduced }: HomeFaqProps) {
  const t = useTranslations("home");

  return (
    <Box
      component="section"
      id="faq"
      sx={{
        scrollMarginTop: "96px",
        mt: { xs: 7, md: 9 },
        mb: { xs: 6, md: 8 },
      }}
    >
      <RevealOnScroll reduced={reduced} y={18} duration={0.5} margin="0px">
        <Typography variant="h2" sx={{ mb: 3 }}>
          {t("faq.title")}
        </Typography>
      </RevealOnScroll>
      <Stack spacing={1.5}>
        {faqIds.map((item, idx) => (
          <RevealOnScroll key={item.q} reduced={reduced} y={20} duration={0.45} delay={idx * 0.05}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}>
                <Typography sx={{ fontWeight: 650 }}>{t(item.q)}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                  {t(item.a)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </RevealOnScroll>
        ))}
      </Stack>
    </Box>
  );
}
