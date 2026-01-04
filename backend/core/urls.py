from django.contrib import admin
from django.urls import path
# Importamos la vista usando la ruta desde la raíz del proyecto
from .views import procesar_dataset 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('analizar/', procesar_dataset, name='analizar'),
]