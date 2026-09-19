import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Loader2, Home, ChevronRight, AlertCircle } from 'lucide-react';

// প্রপস হিসেবে pageId রিসিভ করবে, যাতে একই পেজ দিয়ে ৩টি পলিসি দেখানো যায়
const LegalPageViewer = ({ pageId }: { pageId: string }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId) return;
      setIsLoading(true);
      setError(false);
      
      try {
        const docRef = doc(db, 'legalPages', pageId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTitle(docSnap.data().title || formatTitle(pageId));
          setContent(docSnap.data().content || '');
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching legal page:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [pageId]);

  // যদি ডাটাবেজে টাইটেল না থাকে, তবে URL থেকে টাইটেল বানিয়ে নেবে
  const formatTitle = (id: string) => {
    return id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading document...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          The legal document you are looking for does not exist or has not been published yet. Please check back later.
        </p>
        <Link to="/" className="btn-primary px-8">Return to Homepage</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{title} | LoomoRA</title>
        <meta name="description" content={`Read our ${title} to understand our policies.`} />
      </Helmet>

      <div className="bg-white min-h-screen pb-20">
        
        {/* Page Header */}
        <div className="bg-[#F8FAFC] py-12 px-4 border-b border-gray-100">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              {title}
            </h1>
            <nav className="flex items-center justify-center text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600 flex items-center transition-colors"><Home className="w-4 h-4" /></Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <span className="text-gray-900 font-medium">Legal</span>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <span className="text-gray-900 font-medium">{title}</span>
            </nav>
          </div>
        </div>

        {/* Dynamic Rich Text Content Area */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white">
            <div 
              className="legal-content text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>

        {/* Custom Scoped CSS for the Rich Text content */}
        <style>{`
          .legal-content h1, .legal-content h2, .legal-content h3, .legal-content h4 {
            color: #111827;
            font-weight: 700;
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          .legal-content h1 { font-size: 2.25rem; }
          .legal-content h2 { font-size: 1.875rem; }
          .legal-content h3 { font-size: 1.5rem; }
          .legal-content p { margin-bottom: 1.25rem; }
          .legal-content ul, .legal-content ol { padding-left: 1.5rem; margin-bottom: 1.25rem; }
          .legal-content ul { list-style-type: disc; }
          .legal-content ol { list-style-type: decimal; }
          .legal-content a { color: #2563EB; text-decoration: underline; }
          .legal-content strong { color: #111827; }
        `}</style>
      </div>
    </>
  );
};

export default LegalPageViewer;