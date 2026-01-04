from rest_framework.decorators import api_view
from rest_framework.response import Response
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
from scipy.io import arff # RECUERDA: pip install scipy

@api_view(['POST'])
def procesar_dataset(request):
    archivo = request.FILES.get('file')
    test_size = float(request.data.get('test_size', 0.2)) 
    
    try:
        # --- 1. LECTURA (Soporta CSV y ARFF) ---
        nombre_archivo = archivo.name
        if nombre_archivo.endswith('.arff'):
            data, meta = arff.loadarff(archivo)
            df = pd.DataFrame(data)
            # Decodificamos texto b'ejemplo' a 'ejemplo'
            for col in df.select_dtypes([object]):
                try:
                    df[col] = df[col].str.decode('utf-8')
                except:
                    pass
        else:
            df = pd.read_csv(archivo)

        # --- 2. LÓGICA DE SALUD ---
        nulos_por_columna = df.isnull().sum().to_dict()
        total_nulos = sum(nulos_por_columna.values())
        columnas_con_nulos = [col for col, count in nulos_por_columna.items() if count > 0]
        
        if total_nulos == 0:
            estado_salud = "Óptimo"
            color_salud = "#00C49F"
        elif total_nulos < (len(df) * 0.1):
            estado_salud = "Advertencia"
            color_salud = "#FFBB28"
        else:
            estado_salud = "Crítico"
            color_salud = "#ff5252"

        # --- 3. CÁLCULO DE HISTOGRAMAS (Esto es lo que faltaba) ---
        histogramas = {}
        columnas_numericas = df.select_dtypes(include=[np.number]).columns
        
        for columna in columnas_numericas:
            datos_limpios = df[columna].dropna()
            if not datos_limpios.empty:
                counts, bins = np.histogram(datos_limpios, bins=10)
                histogramas[columna] = {
                    "counts": counts.tolist(),
                    "bins": bins.tolist()
                }

        # --- 4. SPLIT DE DATOS ---
        train, test = train_test_split(df, test_size=test_size, random_state=42)
        
        # --- 5. RESPUESTA AL FRONTEND ---
        resumen = {
            "total_filas": len(df),
            "filas_entrenamiento": len(train),
            "filas_test": len(test),
            "columnas": list(df.columns),
            "stats": train.describe().to_dict(),
            "histogramas": histogramas, # <--- Clave para que se vea la gráfica
            "salud": {
                "nulos": total_nulos,
                "estado": estado_salud,
                "color": color_salud,
                "columnas_criticas": columnas_con_nulos
            }
        }
        return Response(resumen)
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)