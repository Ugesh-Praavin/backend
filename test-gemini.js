require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('GEMINI_API_KEY found:', !!process.env.GEMINI_API_KEY);
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('Gemini model initialized successfully');
    
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: "Hello! Can you respond with a short, friendly message?" }] 
      }]
    });
    
    const reply = result.response.text();
    console.log('Gemini response:', reply);
    console.log('✅ Gemini API is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:', error);
  }
}

testGemini();
