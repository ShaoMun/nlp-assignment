import json
from difflib import SequenceMatcher
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rouge_score import rouge_scorer
from bert_score import score as bert_score
import numpy as np
import nltk
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from nltk.tokenize import word_tokenize
from nltk.metrics import jaccard_distance

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
except:
    pass

def preprocess_text(text):
    """Basic text preprocessing."""
    # Remove newlines and multiple spaces
    text = ' '.join(text.split())
    return text.lower().strip()

def calculate_bleu_score(reference, candidate):
    """Calculate BLEU score."""
    try:
        reference_tokens = word_tokenize(reference)
        candidate_tokens = word_tokenize(candidate)
        smoothing = SmoothingFunction().method1
        return sentence_bleu([reference_tokens], candidate_tokens, smoothing_function=smoothing)
    except:
        return 0.0

def calculate_jaccard_similarity(text1, text2):
    """Calculate Jaccard similarity."""
    try:
        words1 = set(word_tokenize(text1))
        words2 = set(word_tokenize(text2))
        return 1 - jaccard_distance(words1, words2)
    except:
        return 0.0

def extract_relevant_content(pdf_content):
    """Extract relevant sections about mental health definition and concepts."""
    sections = []
    current_section = []
    
    for line in pdf_content.split('\n'):
        line = line.strip()
        if not line:
            if current_section:
                sections.append(' '.join(current_section))
                current_section = []
            continue
            
        if any(marker in line for marker in [
            "Mental health",
            "The concept relates",
            "Like physical health",
            "Good mental health",
            "Risk factors"
        ]):
            if current_section:
                sections.append(' '.join(current_section))
            current_section = [line]
        elif current_section:
            current_section.append(line)
    
    if current_section:
        sections.append(' '.join(current_section))
    
    return ' '.join(sections)

def evaluate_model_responses(pdfs, chat_history):
    # Initialize scorers
    rouge_scorer_inst = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
    metrics = {}
    
    # Get ground truth content
    pdf = next(pdf for pdf in pdfs if "Mental health is a positive concept" in pdf['content'])
    ground_truth = extract_relevant_content(pdf['content'])
    ground_truth = preprocess_text(ground_truth)
    
    print("Ground Truth:")
    print(ground_truth)
    print("\nEvaluating responses against this ground truth...\n")
    
    # Group responses by model
    model_responses = {}
    for msg in chat_history:
        if msg.get('model_name') and msg.get('role') == 'assistant':
            model_name = msg['model_name']
            if model_name not in model_responses:
                model_responses[model_name] = []
            model_responses[model_name].append(msg['content'])
    
    # Evaluate each model's responses
    for model_name, responses in model_responses.items():
        metrics[model_name] = {
            'responses': [],
            'rouge1_f': [], 'rouge2_f': [], 'rougeL_f': [],
            'rouge1_p': [], 'rouge2_p': [], 'rouge1_r': [], 'rouge2_r': [],
            'cosine': [], 'levenshtein': [],
            'bleu': [], 'jaccard': [],
            'bert_precision': [], 'bert_recall': [], 'bert_f1': []
        }
        
        print(f"\nModel: {model_name}")
        for response in responses:
            processed_response = preprocess_text(response)
            print(f"Response: {processed_response[:100]}...\n")
            
            # Calculate ROUGE scores
            rouge_scores = rouge_scorer_inst.score(ground_truth, processed_response)
            
            # Calculate BERTScore
            P, R, F1 = bert_score([processed_response], [ground_truth], lang='en')
            
            # Calculate other metrics
            try:
                # TF-IDF Cosine similarity
                vectorizer = TfidfVectorizer()
                tfidf = vectorizer.fit_transform([ground_truth, processed_response])
                cos_sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
                
                # Levenshtein ratio
                lev_ratio = SequenceMatcher(None, ground_truth, processed_response).ratio()
                
                # BLEU score
                bleu = calculate_bleu_score(ground_truth, processed_response)
                
                # Jaccard similarity
                jaccard = calculate_jaccard_similarity(ground_truth, processed_response)
                
            except Exception as e:
                print(f"Error calculating metrics: {e}")
                cos_sim = lev_ratio = bleu = jaccard = 0
            
            # Store all metrics
            metrics[model_name]['responses'].append(processed_response)
            metrics[model_name]['rouge1_f'].append(rouge_scores['rouge1'].fmeasure)
            metrics[model_name]['rouge2_f'].append(rouge_scores['rouge2'].fmeasure)
            metrics[model_name]['rougeL_f'].append(rouge_scores['rougeL'].fmeasure)
            metrics[model_name]['rouge1_p'].append(rouge_scores['rouge1'].precision)
            metrics[model_name]['rouge2_p'].append(rouge_scores['rouge2'].precision)
            metrics[model_name]['rouge1_r'].append(rouge_scores['rouge1'].recall)
            metrics[model_name]['rouge2_r'].append(rouge_scores['rouge2'].recall)
            metrics[model_name]['cosine'].append(cos_sim)
            metrics[model_name]['levenshtein'].append(lev_ratio)
            metrics[model_name]['bleu'].append(bleu)
            metrics[model_name]['jaccard'].append(jaccard)
            metrics[model_name]['bert_precision'].append(P.item())
            metrics[model_name]['bert_recall'].append(R.item())
            metrics[model_name]['bert_f1'].append(F1.item())
    
    # Calculate final averages
    final_metrics = {}
    for model_name, scores in metrics.items():
        final_metrics[model_name] = {
            'num_responses': len(scores['responses']),
            'rouge1_f': np.mean(scores['rouge1_f']),
            'rouge2_f': np.mean(scores['rouge2_f']),
            'rougeL_f': np.mean(scores['rougeL_f']),
            'rouge1_p': np.mean(scores['rouge1_p']),
            'rouge2_p': np.mean(scores['rouge2_p']),
            'rouge1_r': np.mean(scores['rouge1_r']),
            'rouge2_r': np.mean(scores['rouge2_r']),
            'cosine': np.mean(scores['cosine']),
            'levenshtein': np.mean(scores['levenshtein']),
            'bleu': np.mean(scores['bleu']),
            'jaccard': np.mean(scores['jaccard']),
            'bert_precision': np.mean(scores['bert_precision']),
            'bert_recall': np.mean(scores['bert_recall']),
            'bert_f1': np.mean(scores['bert_f1'])
        }
    
    return final_metrics

def main():
    # Load data
    with open('pdfs.json', 'r') as f:
        pdfs = json.load(f)
    with open('chat_history.json', 'r') as f:
        chat_history = json.load(f)
    
    # Evaluate
    metrics = evaluate_model_responses(pdfs, chat_history)
    
    # Print results
    print("\nFinal Metrics:")
    print("=" * 50)
    for model_name, scores in metrics.items():
        print(f"\nModel: {model_name}")
        print(f"Number of responses: {scores['num_responses']}")
        
        print("\nText Similarity Metrics:")
        print(f"  Levenshtein: {scores['levenshtein']:.4f}")
        print(f"  Cosine: {scores['cosine']:.4f}")
        print(f"  Jaccard: {scores['jaccard']:.4f}")
        print(f"  BLEU: {scores['bleu']:.4f}")
        
        print("\nROUGE Scores:")
        print("  ROUGE-1:")
        print(f"    F1: {scores['rouge1_f']:.4f}")
        print(f"    Precision: {scores['rouge1_p']:.4f}")
        print(f"    Recall: {scores['rouge1_r']:.4f}")
        print("  ROUGE-2:")
        print(f"    F1: {scores['rouge2_f']:.4f}")
        print(f"    Precision: {scores['rouge2_p']:.4f}")
        print(f"    Recall: {scores['rouge2_r']:.4f}")
        
        print("\nBERTScore:")
        print(f"  Precision: {scores['bert_precision']:.4f}")
        print(f"  Recall: {scores['bert_recall']:.4f}")
        print(f"  F1: {scores['bert_f1']:.4f}")
        print("-" * 50)

if __name__ == "__main__":
    main()