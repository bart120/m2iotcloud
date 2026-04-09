import { useState } from "react";
import api from "./services/api";
import { uploadFileToBlob } from "./services/blob";

function App() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInitAndUpload = async () => {
    if (!file) {
      setMessage("Veuillez sélectionner un fichier.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const initResponse = await api.post("/jobs", {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      });

      const { jobId, uploadUrl, status } = initResponse.data;

      setJobId(jobId);
      setStatus(status);

      await uploadFileToBlob(uploadUrl, file);

      setMessage("Fichier uploadé avec succès.");
    } catch (error) {
      console.error(error);
      setMessage("Erreur pendant l'initialisation ou l'upload.");
    } finally {
      setLoading(false);
    }
  };

  const checkJobStatus = async () => {
    if (!jobId) return;

    try {
      const response = await api.get(`/jobs/${jobId}`);
      setStatus(response.data.status);
    } catch (error) {
      console.error(error);
      setMessage("Impossible de récupérer le statut du job.");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Cloud Document Processing</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <div style={{ marginTop: 16 }}>
        <button onClick={handleInitAndUpload} disabled={loading}>
          {loading ? "Chargement..." : "Initialiser et uploader"}
        </button>
      </div>

      {jobId && (
        <div style={{ marginTop: 24 }}>
          <p><strong>Job ID :</strong> {jobId}</p>
          <p><strong>Status :</strong> {status}</p>
          <button onClick={checkJobStatus}>Vérifier le statut</button>
        </div>
      )}

      {message && (
        <div style={{ marginTop: 24 }}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}

export default App;