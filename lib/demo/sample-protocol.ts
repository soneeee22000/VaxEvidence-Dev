import { createProtocol } from "@/lib/supabase/protocols";

/**
 * Sample protocol PICO values used to seed a new user's workspace.
 */
export const SAMPLE_PROTOCOL = {
  title: "COVID-19 mRNA Vaccine Effectiveness in Healthcare Workers",
  study_question:
    "What is the real-world effectiveness of BNT162b2 (Pfizer-BioNTech) and mRNA-1273 (Moderna) vaccines against symptomatic SARS-CoV-2 infection in healthcare workers during the Omicron-dominant period?",
  population:
    "Healthcare workers aged 18-65 employed at US acute care hospitals with baseline seronegative status and no prior documented SARS-CoV-2 infection.",
  intervention:
    "Primary series plus bivalent booster dose of BNT162b2 or mRNA-1273 mRNA COVID-19 vaccines.",
  comparator:
    "Unvaccinated or primary-series-only healthcare workers from the same facilities during the same surveillance period.",
  outcomes:
    "Primary: Vaccine effectiveness against RT-PCR-confirmed symptomatic COVID-19. Secondary: VE against hospitalization, days of work missed, and viral load (Ct values) in breakthrough infections.",
  design: "Prospective cohort study with test-negative design sub-analysis",
  status: "draft" as const,
} as const;

/**
 * Seed a sample protocol into the new user's workspace.
 * Returns the newly created protocol's ID, or null on failure.
 */
export async function seedSampleProtocol(
  userId: string,
): Promise<string | null> {
  const { data, error } = await createProtocol({
    ...SAMPLE_PROTOCOL,
    user_id: userId,
  });

  if (error || !data) {
    console.warn("Failed to seed sample protocol:", error?.message);
    return null;
  }

  return data.id;
}
