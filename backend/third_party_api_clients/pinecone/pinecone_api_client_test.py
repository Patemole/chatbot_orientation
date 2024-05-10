'''
# Ce script teste l'initialisation et l'accessibilité de l'attribut 'vectorstore'
# dans l'instance de PineconeApiClient.

import os
import sys

# Assurez-vous que le chemin vers votre module pinecone_api_client est correct
# Exemple de chemin relatif si test_pinecone_client.py est à la racine du projet
sys.path.append(os.path.join(os.path.dirname(__file__), 'chemin_vers_le_dossier_contenant_pinecone_api_client'))

from pinecone_api_client import PineconeApiClient

def test_vectorstore_access():
    print("Création de l'instance de PineconeApiClient...")
    try:
        # Création de l'instance du client Pinecone
        api_client = PineconeApiClient()
        
        # Tentative d'accès à l'attribut vectorstore
        print("Test d'accès à 'vectorstore'...")
        vectorstore = api_client.vectorstore
        
        # Si aucune exception n'est levée et vectorstore est accessible
        print("Accès à 'vectorstore' réussi. Informations de 'vectorstore' :")
        print(vectorstore)

    except AttributeError as e:
        # Gestion de l'erreur si 'vectorstore' n'est pas un attribut
        print(f"Erreur d'attribut: {e}")
    except Exception as e:
        # Gestion de toute autre exception
        print(f"Une erreur inattendue est survenue: {e}")

if __name__ == "__main__":
    test_vectorstore_access()
'''

# Ce script teste l'initialisation et l'accessibilité de l'attribut 'vectorstore'
# dans l'instance de PineconeApiClient.

import os
import sys

# Assurez-vous que le chemin vers votre module pinecone_api_client est correct
# Ajoutez le chemin du dossier contenant le dossier 'third_party_api_clients' à sys.path
# Si votre script est situé dans /Users/gregoryhissiger/Desktop/CHATBOT_ORIENTATION_COURSES/backend/third_party_api_clients/pinecone/
# Vous devez remonter de deux niveaux pour inclure le dossier 'backend' qui contient 'third_party_api_clients'
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from third_party_api_clients.pinecone.pinecone_api_client import PineconeApiClient

def test_vectorstore_access():
    print("Création de l'instance de PineconeApiClient...")
    try:
        # Création de l'instance du client Pinecone
        api_client = PineconeApiClient()
        
        # Tentative d'accès à l'attribut vectorstore
        print("Test d'accès à 'vectorstore'...")
        vectorstore = api_client.vectorstore
        
        # Si aucune exception n'est levée et vectorstore est accessible
        print("Accès à 'vectorstore' réussi. Informations de 'vectorstore' :")
        print(vectorstore)

    except AttributeError as e:
        # Gestion de l'erreur si 'vectorstore' n'est pas un attribut
        print(f"Erreur d'attribut: {e}")
    except Exception as e:
        # Gestion de toute autre exception
        print(f"Une erreur inattendue est survenue: {e}")

if __name__ == "__main__":
    test_vectorstore_access()



