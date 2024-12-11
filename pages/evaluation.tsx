import { useEffect, useState } from 'react';
import styles from '../styles/Evaluation.module.css';

interface EvaluationMetrics {
  contentAccuracy: number;
  relevance: number;
  completeness: number;
  overallScore: number;
  details: {
    keyFactsIdentified: string[];
    missingKeyFacts: string[];
    incorrectStatements: string[];
  }
}

interface EvaluationResponse {
  evaluations: { [key: string]: EvaluationMetrics };
  summary: {
    averageAccuracy: number;
    averageRelevance: number;
    averageCompleteness: number;
    averageOverallScore: number;
  } | null;
}

export default function Evaluation() {
  const [data, setData] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluationData();
  }, []);

  const fetchEvaluationData = async () => {
    try {
      const response = await fetch('/api/evaluation');
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError('Failed to fetch evaluation data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (error) return <div className={styles.container}>{error}</div>;
  if (!data) return <div className={styles.container}>No data available</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Chat Evaluation Results</h1>
      
      {/* Summary Section */}
      <section className={styles.summary}>
        <h2 className={styles.subtitle}>Overall Summary</h2>
        {data.summary && (
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <label>Average Accuracy:</label>
              <span>{(data.summary.averageAccuracy * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.metric}>
              <label>Average Relevance:</label>
              <span>{(data.summary.averageRelevance * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.metric}>
              <label>Average Completeness:</label>
              <span>{(data.summary.averageCompleteness * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.metric}>
              <label>Average Overall Score:</label>
              <span>{(data.summary.averageOverallScore * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </section>

      {/* Detailed Evaluations */}
      <section className={styles.details}>
        <h2 className={styles.subtitle}>Detailed Evaluations</h2>
        {data.evaluations && Object.entries(data.evaluations).length > 0 ? (
          Object.entries(data.evaluations).map(([id, evaluation]) => (
            <div key={id} className={styles.evaluationCard}>
              <h3 className={styles.responseTitle}>Response ID: {id}</h3>
              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <label>Content Accuracy:</label>
                  <span>{(evaluation.contentAccuracy * 100).toFixed(1)}%</span>
                </div>
                <div className={styles.metric}>
                  <label>Relevance:</label>
                  <span>{(evaluation.relevance * 100).toFixed(1)}%</span>
                </div>
                <div className={styles.metric}>
                  <label>Completeness:</label>
                  <span>{(evaluation.completeness * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className={styles.factLists}>
                <div className={styles.factList}>
                  <h4>Key Facts Identified:</h4>
                  <ul>
                    {evaluation.details.keyFactsIdentified.map((fact, index) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.factList}>
                  <h4>Missing Key Facts:</h4>
                  <ul>
                    {evaluation.details.missingKeyFacts.map((fact, index) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.factList}>
                  <h4>Incorrect Statements:</h4>
                  <ul>
                    {evaluation.details.incorrectStatements.map((statement, index) => (
                      <li key={index}>{statement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No evaluation data available</p>
        )}
      </section>
    </div>
  );
} 