import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, ChevronUp, HelpCircle, Mail, Home, ChevronRight, MessageCircle } from 'lucide-react';

const faqs = [
  {
    category: "Orders & Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping typically takes 3-5 business days within the country. International shipping may take 7-14 business days depending on the destination. You will receive a tracking number once your order is dispatched."
      },
      {
        q: "How can I track my order?",
        a: "Once your order ships, we will send you a confirmation email with a tracking link. You can also track your order directly on our website by going to the 'Track Order' page and entering your Order ID."
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes! We offer free standard shipping on all orders over $200. For orders under $200, a flat shipping rate of $15 applies."
      }
    ]
  },
  {
    category: "Returns & Exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 30 days of delivery for a full refund or exchange. Items must be unworn, unwashed, and have the original tags attached."
      },
      {
        q: "How do I start a return?",
        a: "To start a return, please visit your 'Order History' in your account dashboard, select the order, and click on 'Request Return'. You can also contact our support team for assistance."
      }
    ]
  },
  {
    category: "Products & Sizing",
    questions: [
      {
        q: "How do I know what size to choose?",
        a: "We provide a detailed 'Size Guide' on every product page. We recommend comparing your measurements with our size chart to find the perfect fit."
      },
      {
        q: "Are the colors exactly as they appear on the website?",
        a: "We make every effort to display the colors of our products accurately. However, depending on your monitor or device screen settings, slight color variations may occur."
      }
    ]
  }
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0"); // Default open first question

  const toggleFaq = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions | LoomoRA</title>
        <meta name="description" content="Find answers to common questions about shipping, returns, and products at LoomoRA." />
      </Helmet>

      <div className="bg-white min-h-screen pb-20">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="bg-[#F8FAFC] pt-16 pb-12 px-4 border-b border-gray-100">
          <div className="max-w-4xl mx-auto text-center animate-[fadeInUp_0.8s_ease-out]">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              How can we help?
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-6">
              Find answers to our most frequently asked questions below.
            </p>
            
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600 flex items-center transition-colors"><Home className="w-4 h-4" /></Link>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              <span className="text-gray-900 font-medium">FAQ</span>
            </nav>
          </div>
        </div>

        {/* ================= FAQ CONTENT ================= */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-12">
            {faqs.map((section, sIdx) => (
              <div key={sIdx} className="animate-[fadeInUp_0.8s_ease-out]" style={{ animationDelay: `${sIdx * 0.1}s` }}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
                  {section.category}
                </h2>
                
                <div className="space-y-4">
                  {section.questions.map((faq, qIdx) => {
                    const index = `${sIdx}-${qIdx}`;
                    const isOpen = openIndex === index;

                    return (
                      <div 
                        key={qIdx} 
                        className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                          isOpen ? 'border-blue-600 shadow-md bg-white' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                        }`}
                      >
                        <button 
                          onClick={() => toggleFaq(index)}
                          className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                        >
                          <span className={`text-lg font-bold pr-4 transition-colors ${isOpen ? 'text-blue-600' : 'text-gray-900'}`}>
                            {faq.q}
                          </span>
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-400'}`}>
                            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </button>
                        
                        <div 
                          className={`px-5 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                            isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <p className="text-gray-600 leading-relaxed font-medium">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ================= STILL NEED HELP CTA ================= */}
          <div className="mt-20 bg-[#0F172A] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Still have questions?</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto">
                Can't find the answer you're looking for? Our friendly support team is ready to help you out.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95 group"
              >
                <Mail className="w-5 h-5 mr-2" /> Contact Support
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Faq;