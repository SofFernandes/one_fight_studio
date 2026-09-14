import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUrlAssinadaFoto(
  supabase: SupabaseClient,
  caminho: string,
  ttlSegundos = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("fotos-alunas")
    .createSignedUrl(caminho, ttlSegundos);

  if (error || !data) return null;
  return data.signedUrl;
}
