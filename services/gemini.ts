/**
 * Generates a professional service description based on title and category.
 * This is a simple template-based generator (no external API required).
 */
export const generateServiceDescription = async (title: string, category: string, keywords: string): Promise<string> => {
  // Simple template-based description generator
  const templates = [
    `Looking for professional ${category.toLowerCase()} services? ${title} offers expert solutions with a focus on quality and reliability. ${keywords}. Our experienced team is committed to delivering exceptional results that exceed your expectations. Contact us today for a consultation and experience the difference of working with trusted professionals.`,
    
    `${title} provides top-tier ${category.toLowerCase()} services tailored to your specific needs. ${keywords}. We pride ourselves on our attention to detail, professional approach, and commitment to customer satisfaction. Whether it's a small project or a large-scale job, we're here to help you achieve your goals with reliable, efficient service.`,
    
    `Professional ${category.toLowerCase()} services at your service! ${title} combines expertise with dedication to deliver outstanding results. ${keywords}. Our team is fully licensed, insured, and ready to tackle your project with precision and care. Trust us to get the job done right the first time.`
  ];
  
  // Select template based on title hash for variety
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedTemplate = templates[hash % templates.length];
  
  return selectedTemplate;
};
