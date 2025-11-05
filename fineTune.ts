import OpenAI from "openai";
import fs from "fs";

// Certifique-se de ter a variável de ambiente OPENAI_API_KEY
const client = new OpenAI({
  apiKey: "SUA_CHAVE_API_AQUI", // substitua pela sua chave de API
});

async function main() {
  try {
    // 1️⃣ Upload do dataset
    const file = await client.files.create({
      file: fs.createReadStream("training_data.jsonl"),
      purpose: "fine-tune",
    });
    console.log("📁 Dataset enviado:", file.id);

    // 2️⃣ Criar o fine-tune
    const fineTune = await client.fineTuning.jobs.create({
      model: "gpt-3.5-turbo", // modelo base para fine-tuning
      training_file: file.id,
    });
    console.log("✅ Fine-tuning iniciado:", fineTune.id);

    // 3️⃣ Acompanhar eventos/logs do fine-tune
    const interval = setInterval(async () => {
      const jobStatus = await client.fineTuning.jobs.retrieve(fineTune.id);
      console.log(`🔄 Status atual: ${jobStatus.status}`);
      
      const events = await client.fineTuning.jobs.listEvents(fineTune.id);
      if (events.data.length > 0) {
        console.log("📜 Últimos eventos:", events.data.slice(-5));
      }

      if (jobStatus.status === "succeeded" || jobStatus.status === "failed") {
        clearInterval(interval);
        console.log("🏁 Fine-tuning finalizado. Modelo:", jobStatus.fine_tuned_model);
      }
    }, 10000); // verifica a cada 10s

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

// 4️⃣ Usar o modelo fine-tuned (após treinamento)
async function usarModelo(modelName: string) {
  const completion = await client.chat.completions.create({
    model: modelName,
    messages: [{ role: "user", content: "Diga olá" }],
  });
  console.log("💬 Resposta do modelo fine-tuned:", completion.choices[0].message?.content);
}

main();
