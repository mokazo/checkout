import { Merchant } from '../types';

export interface ChronopostPoint {
  identifiant: string;
  nom: string;
  adresse1: string;
  codePostal: string;
  localite: string;
  horaires?: string;
}

/**
 * Service to interact with Chronopost Web Services (SOAP).
 * Documentation reference: https://www.chronopost.fr/fr/aide/faq/l-api-chronopost
 * GitHub reference: https://github.com/scopen-coop/ChronopostWS
 */
export const chronopostService = {

  /**
   * Constructs the SOAP XML envelope for 'recherchePointChronopostInter'.
   * In a real production app, this XML generation and the fetch call 
   * should happen on your Node.js backend to avoid CORS issues and expose credentials.
   */
  searchRelayPoints: async (
    zipCode: string, 
    merchantConfig: Merchant['chronopostConfig']
  ): Promise<ChronopostPoint[]> => {
    
    if (!merchantConfig?.enabled || !merchantConfig.accountNumber) {
      console.warn("Chronopost not configured");
      return [];
    }

    // SIMULATION: In a real environment, we would POST this XML to:
    // https://www.chronopost.fr/recherchebt-ws-cxf/PointRelaisServiceWS?wsdl
    const soapEnvelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cxf="http://cxf.rechercheBt.soap.chronopost.fr/">
         <soapenv:Header/>
         <soapenv:Body>
            <cxf:recherchePointChronopostInter>
               <accountNumber>${merchantConfig.accountNumber}</accountNumber>
               <password>${merchantConfig.password}</password>
               <codePostal>${zipCode}</codePostal>
               <date>24/01/2026</date>
               <maxPointChronopost>10</maxPointChronopost>
               <maxDistanceSearch>10</maxDistanceSearch>
               <holidayTolerant>1</holidayTolerant>
            </cxf:recherchePointChronopostInter>
         </soapenv:Body>
      </soapenv:Envelope>
    `;

    console.log("Generating SOAP Request for Chronopost...", zipCode);

    // MOCK NETWORK DELAY & RESPONSE
    // Since we cannot hit the real SOAP API from a browser sandbox due to CORS,
    // we return realistic mock data based on the provided Zip Code.
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return dummy points based on the input zip code
        if (zipCode === '77600') {
           resolve([
            { identifiant: 'P7701', nom: 'AU PANIER DE BUSSY', adresse1: '28 BOULEVARD DE LAGNY', codePostal: '77600', localite: 'BUSSY SAINT GEORGES' },
            { identifiant: 'P7702', nom: 'PRESSING DU GOLF', adresse1: '12 AVENUE DU GENERAL DE GAULLE', codePostal: '77600', localite: 'BUSSY SAINT GEORGES' },
            { identifiant: 'P7703', nom: 'TABAC DE LA GARE RER', adresse1: 'PLACE DE LA GARE', codePostal: '77600', localite: 'BUSSY SAINT GEORGES' },
            { identifiant: 'P7704', nom: 'LIBRARIE GRAND PLACE', adresse1: '8 GRAND PLACE', codePostal: '77600', localite: 'BUSSY SAINT GEORGES' }
           ]);
        } else if (zipCode.startsWith('75')) {
          resolve([
            { identifiant: 'P1234', nom: 'TABAC DE LA MAIRIE', adresse1: '12 RUE DE RIVOLI', codePostal: zipCode, localite: 'PARIS' },
            { identifiant: 'P5678', nom: 'PRESSING ECOLOGIQUE', adresse1: '45 BD SEBASTOPOL', codePostal: zipCode, localite: 'PARIS' },
            { identifiant: 'P9012', nom: 'AU BON COIN', adresse1: '8 RUE DES HALLES', codePostal: zipCode, localite: 'PARIS' },
          ]);
        } else if (zipCode.startsWith('69')) {
           resolve([
            { identifiant: 'L3321', nom: 'RELAIS LYONNAIS', adresse1: '5 PLACE BELLECOUR', codePostal: zipCode, localite: 'LYON' },
            { identifiant: 'L4455', nom: 'KIOQUE JOURNAUX', adresse1: '12 RUE VICTOR HUGO', codePostal: zipCode, localite: 'LYON' },
          ]);
        } else {
          // Generic fallback for other zips
           resolve([
            { identifiant: 'X9999', nom: 'SUPERETTE DU COIN', adresse1: '1 PLACE DU MARCHE', codePostal: zipCode, localite: 'VILLE' },
            { identifiant: 'X8888', nom: 'FLEURISTE PASSION', adresse1: '14 AVENUE DE LA GARE', codePostal: zipCode, localite: 'VILLE' },
          ]);
        }
      }, 800);
    });
  }
};