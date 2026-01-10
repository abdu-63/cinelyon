import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Test que la route /health répond OK."""
    rv = client.get('/health')
    assert rv.status_code == 200
    assert b"OK" in rv.data

def test_home_page(client):
    """Test que la page d'accueil charge sans erreur 500."""
    # Note: Cela peut echouer si movies.json est manquant ou corrompu, 
    # mais load_movies_data gère le cas de fichier manquant.
    rv = client.get('/')
    assert rv.status_code == 200
