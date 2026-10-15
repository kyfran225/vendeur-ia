import { describe, it, expect } from 'vitest';
import { aiAgentService } from '../services/ai-agent.service.js';

describe('Service & Digital Sales Coherence (Zero Delivery Hallucination)', () => {
  it('should not mention delivery, packages, or neighborhood for a service business', () => {
    const mockServiceMerchant = {
      _id: 'merchant_serv_123',
      businessName: 'Vendeur IA Services',
      category: 'services',
      city: 'Abidjan',
      country: 'CI',
      currency: 'XOF',
      slug: 'vendeur-ia-services'
    };

    const mockServiceProducts = [
      {
        _id: 'serv_1',
        name: 'Pack Accompagnement Commercial IA',
        price: 25000,
        currency: 'XOF',
        description: 'Mise en place complète et formation personnalisée',
        isService: true,
        serviceDuration: '1 mois'
      }
    ];

    const prompt = (aiAgentService as any).buildSystemPrompt({
      merchant: mockServiceMerchant,
      products: mockServiceProducts,
      knowledge: {},
      history: [{ role: 'customer', text: 'Bonjour, je veux prendre votre pack' }],
      message: 'Comment on procède ?',
      customerPhone: '+2250700000000',
      platform: 'whatsapp'
    });

    // Verify absence of physical delivery concepts
    expect(prompt).not.toContain('quartier pour la livraison');
    expect(prompt).not.toContain('bloquer ton colis');
    expect(prompt).not.toContain('frais de livraison');

    // Verify service-oriented coherence
    expect(prompt).toContain('PRESTATION DE SERVICE, COACHING & CONSULTING (SANS EXPÉDITION PHYSIQUE)');
    expect(prompt).toContain('Récapitulatif de votre réservation');
    expect(prompt).toContain('bloquer et valider définitivement ton créneau');
    expect(prompt).toContain('Accès Digital / Service en ligne');
  });

  it('should not mention delivery or parcels for digital SaaS products', () => {
    const mockDigitalMerchant = {
      _id: 'merchant_dig_123',
      businessName: 'Logiciel SaaS Pro',
      category: 'digital',
      city: 'Dakar',
      country: 'SN',
      currency: 'XOF',
      slug: 'logiciel-saas-pro'
    };

    const mockDigitalProducts = [
      {
        _id: 'dig_1',
        name: 'Licence Annuelle SaaS',
        price: 50000,
        currency: 'XOF',
        description: 'Accès illimité plateforme web',
        digitalUrl: 'https://app.example.com'
      }
    ];

    const prompt = (aiAgentService as any).buildSystemPrompt({
      merchant: mockDigitalMerchant,
      products: mockDigitalProducts,
      knowledge: {},
      history: [],
      message: 'C\'est quoi votre offre annuelle ?',
      customerPhone: '+221770000000',
      platform: 'whatsapp'
    });

    // Must not mention physical shipping
    expect(prompt).not.toContain('quartier pour la livraison');
    expect(prompt).not.toContain('bloquer ton colis');
    expect(prompt).toContain('PRODUITS DIGITAUX / SAAS / FORMATIONS (SANS LIVRAISON)');
    expect(prompt).toContain('Formule / Offre Digitale');
    expect(prompt).toContain('Accès digital immédiat après validation');
    expect(prompt).toContain('Accès Digital / Service en ligne');
  });

  it('should properly keep delivery instructions for physical goods like fashion', () => {
    const mockFashionMerchant = {
      _id: 'merchant_fash_123',
      businessName: 'Boutique Mode Chic',
      category: 'fashion',
      city: 'Abidjan',
      country: 'CI',
      currency: 'XOF',
      slug: 'mode-chic'
    };

    const mockFashionProducts = [
      {
        _id: 'prod_fash_1',
        name: 'Robe Cocktail Soie',
        price: 20000,
        currency: 'XOF',
        stock: 4,
        description: 'Robe élégante taille M/L'
      }
    ];

    const prompt = (aiAgentService as any).buildSystemPrompt({
      merchant: mockFashionMerchant,
      products: mockFashionProducts,
      knowledge: {
        businessRules: {
          deliveryFees: [{ zone: 'Cocody', price: 1500 }]
        }
      },
      history: [],
      message: 'Je veux commander la robe',
      customerPhone: '+2250700000000',
      platform: 'whatsapp'
    });

    // Physical goods should ask for delivery neighborhood
    expect(prompt).toContain('quartier pour la livraison');
    expect(prompt).toContain('bloquer et expédier ton colis');
    expect(prompt).toContain('Cocody');
  });
});
