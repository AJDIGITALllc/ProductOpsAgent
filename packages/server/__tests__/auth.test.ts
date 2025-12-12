import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key';
const JWT_ISSUER = 'product-ops-agent';
const JWT_AUDIENCE = 'product-ops-agent-api';

describe('Auth', () => {
  test('generates valid JWT token', () => {
    const payload = {
      sub: 'user123',
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    
    const token = jwt.sign(payload, JWT_SECRET);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });
  
  test('verifies valid JWT token', () => {
    const payload = {
      sub: 'user123',
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    
    const token = jwt.sign(payload, JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as any;
    
    expect(decoded.sub).toBe('user123');
    expect(decoded.iss).toBe(JWT_ISSUER);
    expect(decoded.aud).toBe(JWT_AUDIENCE);
  });
  
  test('rejects expired token', () => {
    const payload = {
      sub: 'user123',
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    };
    
    const token = jwt.sign(payload, JWT_SECRET);
    
    expect(() => {
      jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    }).toThrow();
  });
  
  test('rejects token with wrong issuer', () => {
    const payload = {
      sub: 'user123',
      iss: 'wrong-issuer',
      aud: JWT_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    
    const token = jwt.sign(payload, JWT_SECRET);
    
    expect(() => {
      jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    }).toThrow();
  });
});
