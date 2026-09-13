import "server-only";

export type ResultadoEnvio = { sucesso: true } | { sucesso: false; erro: string };

// Envia uma mensagem de template pré-aprovado via WhatsApp Cloud API (Meta).
// Fora da janela de 24h de conversa, só templates aprovados podem ser enviados —
// por isso não há envio de texto livre aqui, só templates com parâmetros posicionais.
export async function enviarTemplateWhatsapp(
  telefone: string,
  template: string,
  parametros: string[]
): Promise<ResultadoEnvio> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { sucesso: false, erro: "WhatsApp não configurado." };
  }

  try {
    const resposta = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefone,
          type: "template",
          template: {
            name: template,
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: parametros.map((texto) => ({
                  type: "text",
                  text: texto,
                })),
              },
            ],
          },
        }),
      }
    );

    if (!resposta.ok) {
      const corpo = await resposta.text();
      return {
        sucesso: false,
        erro: `WhatsApp API respondeu ${resposta.status}: ${corpo}`,
      };
    }

    return { sucesso: true };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido ao enviar.",
    };
  }
}
