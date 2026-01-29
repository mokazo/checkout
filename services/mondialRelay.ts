import { Merchant } from '../types';

export interface MondialRelayPoint {
  id: string;
  name: string;
  address: string;
  zipCode: string;
  city: string;
}

/**
 * Service wrapper for Mondial Relay Web Service.
 * Based on: https://github.com/e-amzallag/mondialrelay-api
 * Official Docs: https://www.mondialrelay.fr/files/pdf/Web_Service_D%C3%A9veloppement_FR.pdf
 * Target Method: WSI4_PointRelais_Recherche
 */
export const mondialRelayService = {
  
  /**
   * Generates the MD5 signature required by Mondial Relay API.
   * Signature = MD5(concatenation of parameters + privateKey)
   * Note: In a real app, this MUST be done server-side to keep privateKey secure.
   */
  generateSignature: (params: string[], privateKey: string): string => {
    // Simulation of MD5 hashing (cannot import crypto modules easily in this browser sandbox)
    const concatenated = params.join('') + privateKey;
    console.log(`[MondialRelay] Generating signature for: ${concatenated}`);
    return `MD5_HASH_SIMULATION_${Math.random().toString(36).substring(7)}`; 
  },

  /**
   * Search for Relay Points (WSI4_PointRelais_Recherche).
   */
  searchPoints: async (
    zipCode: string,
    merchantConfig: Merchant['mondialRelayConfig']
  ): Promise<MondialRelayPoint[]> => {
    
    if (!merchantConfig?.enabled || !merchantConfig.enseigne) {
      console.warn("Mondial Relay not configured");
      return [];
    }

    const { enseigne, privateKey } = merchantConfig;
    const country = 'FR';
    
    // Parameters typically used for WSI4
    // We simulate the signature generation to show how it works
    const securityKey = mondialRelayService.generateSignature(
        [enseigne, country, zipCode], 
        privateKey
    );

    // XML Construction for WSI4_PointRelais_Recherche
    // This payload matches what the nodejs library would generate under the hood
    const soapEnvelope = `
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:web="http://www.mondialrelay.fr/webservice/">
        <soap:Header/>
        <soap:Body>
          <web:WSI4_PointRelais_Recherche>
            <web:Enseigne>${enseigne}</web:Enseigne>
            <web:Pays>${country}</web:Pays>
            <web:CP>${zipCode}</web:CP>
            <web:Ville></web:Ville>
            <web:NombreResultats>10</web:NombreResultats>
            <web:Security>${securityKey}</web:Security>
          </web:WSI4_PointRelais_Recherche>
        </soap:Body>
      </soap:Envelope>
    `;

    console.log("[MondialRelay] Sending SOAP Request (WSI4):", soapEnvelope);

    // MOCK RESPONSE SIMULATION
    // Real implementation would POST this XML to https://api.mondialrelay.com/Web_Services.asmx
    
    return new Promise((resolve) => {
      setTimeout(() => {
        if (zipCode === '77600') {
           resolve([
            { id: 'MR-77001', name: 'LOTO PRESSE DE LA MAIRIE', address: '14 PLACE DU MARCHE', zipCode: '77600', city: 'BUSSY SAINT GEORGES' },
            { id: 'MR-77002', name: 'FLEURISTE DES PRES', address: '3 RUE JEAN JAURES', zipCode: '77600', city: 'BUSSY SAINT GEORGES' },
            { id: 'MR-77003', name: 'CORDONNERIE EXPRESS', address: '85 BOULEVARD ANTOINE GIRARD', zipCode: '77600', city: 'BUSSY SAINT GEORGES' },
            { id: 'MR-77004', name: 'AUCHAN DRIVE', address: 'RUE DE MENTON', zipCode: '77600', city: 'BUSSY SAINT GEORGES' }
           ]);
        } else if (zipCode.startsWith('75')) {
            resolve([
                { id: 'MR-75001', name: 'KIOSQUE PARISIEN', address: '12 RUE DE RIVOLI', zipCode: zipCode, city: 'PARIS' },
                { id: 'MR-75002', name: 'LIBRAIRIE DU CENTRE', address: '5 BD SEBASTOPOL', zipCode: zipCode, city: 'PARIS' },
                { id: 'MR-75003', name: 'TABAC DES HALLES', address: '1 RUE PIERRE LESCOT', zipCode: zipCode, city: 'PARIS' }
            ]);
        } else {
           resolve([
            { id: 'MR-001', name: 'POINT RELAIS MONDIAL', address: '10 RUE DU COMMERCE', zipCode: zipCode, city: 'VILLE' },
            { id: 'MR-002', name: 'SUPERETTE MR', address: '5 AVENUE DE LA REPUBLIQUE', zipCode: zipCode, city: 'VILLE' }
          ]);
        }
      }, 600);
    });
  }
};