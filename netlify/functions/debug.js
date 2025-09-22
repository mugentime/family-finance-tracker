// Debug function to see what Netlify sends
export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  const debugInfo = {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    context: context || {}
  };

  console.log('DEBUG FUNCTION:', JSON.stringify(debugInfo, null, 2));

  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers
  });
};