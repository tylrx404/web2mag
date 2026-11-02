import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSafeUrl, isPrivateIPv4, isPrivateIPv6 } from '../src/services/security.js';

describe('Security & SSRF Validation', () => {
  it('rejects empty or whitespace URLs', async () => {
    const res1 = await validateSafeUrl('');
    assert.equal(res1.isValid, false);
    assert.match(res1.error, /required/i);

    const res2 = await validateSafeUrl('https://example.com/some path with spaces');
    assert.equal(res2.isValid, false);
    assert.match(res2.error, /whitespace/i);
  });

  it('rejects unsupported protocols (ftp, file, javascript)', async () => {
    const ftp = await validateSafeUrl('ftp://example.com/file.txt');
    assert.equal(ftp.isValid, false);
    assert.match(ftp.error, /Unsupported protocol/i);

    const file = await validateSafeUrl('file:///etc/passwd');
    assert.equal(file.isValid, false);
    assert.match(file.error, /Unsupported protocol/i);

    const js = await validateSafeUrl('javascript:alert(1)');
    assert.equal(js.isValid, false);
  });

  it('rejects localhost and loopback hostnames', async () => {
    const localhost = await validateSafeUrl('http://localhost:8080/admin');
    assert.equal(localhost.isValid, false);
    assert.match(localhost.error, /localhost/i);

    const ip127 = await validateSafeUrl('http://127.0.0.1/secret');
    assert.equal(ip127.isValid, false);
    assert.match(ip127.error, /localhost/i);
  });

  it('detects private IPv4 ranges accurately', () => {
    // 10.0.0.0/8
    assert.equal(isPrivateIPv4('10.0.0.1'), true);
    assert.equal(isPrivateIPv4('10.254.1.1'), true);

    // 172.16.0.0/12
    assert.equal(isPrivateIPv4('172.16.0.1'), true);
    assert.equal(isPrivateIPv4('172.31.255.254'), true);
    assert.equal(isPrivateIPv4('172.32.0.1'), false); // public

    // 192.168.0.0/16
    assert.equal(isPrivateIPv4('192.168.1.1'), true);
    assert.equal(isPrivateIPv4('192.168.0.254'), true);

    // 127.0.0.0/8
    assert.equal(isPrivateIPv4('127.0.0.1'), true);
    assert.equal(isPrivateIPv4('127.1.2.3'), true);

    // 169.254.0.0/16
    assert.equal(isPrivateIPv4('169.254.169.254'), true);

    // Public IPs
    assert.equal(isPrivateIPv4('8.8.8.8'), false);
    assert.equal(isPrivateIPv4('1.1.1.1'), false);
    assert.equal(isPrivateIPv4('142.250.190.46'), false);
  });

  it('detects private IPv6 ranges accurately', () => {
    assert.equal(isPrivateIPv6('::1'), true);
    assert.equal(isPrivateIPv6('fc00::1'), true);
    assert.equal(isPrivateIPv6('fd12:3456:789a::1'), true);
    assert.equal(isPrivateIPv6('fe80::1'), true);
    assert.equal(isPrivateIPv6('2606:4700:4700::1111'), false); // public Cloudflare
  });

  it('accepts valid public HTTPS URLs', async () => {
    const valid = await validateSafeUrl('https://example.com/editorial/article');
    assert.equal(valid.isValid, true);
    assert.equal(valid.parsedUrl.hostname, 'example.com');
  });
});
