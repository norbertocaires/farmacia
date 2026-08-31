import { TestBed } from '@angular/core/testing';
import { GoogleMapsLoaderService } from './google-maps-loader.service';
import { environment } from '@env/environment';

describe('GoogleMapsLoaderService', () => {
  let service: GoogleMapsLoaderService;
  const originalKey = environment.googleMapsApiKey;

  beforeEach(() => {
    service = TestBed.configureTestingModule({}).inject(GoogleMapsLoaderService);
  });

  afterEach(() => {
    (environment as any).googleMapsApiKey = originalKey;
    document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach((s) => s.remove());
  });

  it('should report not configured when there is no API key', () => {
    (environment as any).googleMapsApiKey = '';
    expect(service.isConfigured).toBe(false);
  });

  it('should reject load() when there is no API key configured', async () => {
    (environment as any).googleMapsApiKey = '';
    await expect(service.load()).rejects.toThrow();
  });

  it('should report configured when an API key is set', () => {
    (environment as any).googleMapsApiKey = 'test-key-123';
    expect(service.isConfigured).toBe(true);
  });

  it('should inject a maps.googleapis.com script with the configured key and the places library', () => {
    (environment as any).googleMapsApiKey = 'test-key-123';

    service.load().catch(() => {}); // não aguarda resolver — só confere a tentativa de carregar

    const script = document.querySelector('script[src*="maps.googleapis.com"]');
    expect(script).toBeTruthy();
    expect(script?.getAttribute('src')).toContain('key=test-key-123');
    expect(script?.getAttribute('src')).toContain('libraries=places');
  });

  it('should only inject the script once across multiple load() calls', () => {
    (environment as any).googleMapsApiKey = 'test-key-123';

    service.load().catch(() => {});
    service.load().catch(() => {});

    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    expect(scripts.length).toBe(1);
  });
});
