// Temporary debug component to verify environment variables
export function DebugEnv() {
  const envPrefix = import.meta.env.VITE_ENV_PREFIX || '(empty)';
  
  console.log('🔍 Environment Debug:');
  console.log('VITE_ENV_PREFIX:', envPrefix);
  console.log('All env vars:', import.meta.env);
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div><strong>ENV DEBUG:</strong></div>
      <div>VITE_ENV_PREFIX: <code>{envPrefix}</code></div>
      <div>Mode: <code>{import.meta.env.MODE}</code></div>
    </div>
  );
}
