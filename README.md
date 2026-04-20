# FlavorMind Model Artefacts

This folder contains the AI assets used by FlavorMind's memory-based recipe workflow.

## Included artefacts

- `tinyllama_flavormind_model`: LoRA adapter files
- `tinyllama_flavormind_merged`: merged model configuration
- `tinyllama_flavormind_f16.gguf`: higher-precision GGUF export
- `flavormind-q4_k_m.gguf`: quantized GGUF used for local Ollama inference
- `flavormind_faiss_fixed.index`: FAISS retrieval index
- `flavormind_retrieval_dataset_fixed.csv`: retrieval dataset used by the backend AI service
- `FlavorMind-AIModel-Train-final.jsonl`: chat-format fine-tuning dataset
- `Modelfile`: Ollama packaging file for local serving

## Quick start

```bash
cd D:\DegreeFinal\flavormind-train_model
ollama create flavormind -f Modelfile
ollama show flavormind
```

Then start the backend AI service from `D:\DegreeFinal\FlavorMind-Backend`:

```bash
uvicorn ai.app:app --reload --host 0.0.0.0 --port 8000
```

For the detailed model card, see `tinyllama_flavormind_model/README.md`.
