import zipfile
import os
from PIL import Image

# Nazwa pliku zip
target_zip = "mycollection.zip"
output_dir = os.getcwd()  # Folder docelowy to bieżący katalog
black_dir = os.path.join(output_dir, "black")
white_dir = os.path.join(output_dir, "white")

# Tworzenie folderów jeśli nie istnieją
os.makedirs(black_dir, exist_ok=True)
os.makedirs(white_dir, exist_ok=True)

# Otwórz plik ZIP
def extract_and_rename(zip_path, black_folder, white_folder):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        for file_info in zip_ref.infolist():
            if file_info.filename.startswith("png/") and len(os.path.basename(file_info.filename)) > 4:
                original_name = os.path.basename(file_info.filename)
                new_name = original_name[4:]  # Usuwanie pierwszych 4 znaków
                black_output_path = os.path.join(black_folder, new_name)
                
                # Wypakowanie do folderu "black"
                with zip_ref.open(file_info.filename) as source, open(black_output_path, 'wb') as target:
                    target.write(source.read())
                
                # Zmiana koloru z czarnego na biały i zapis do "white"
                convert_black_to_white(black_output_path, white_folder)

def convert_black_to_white(image_path, white_folder):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(255, 255, 255, a) if (r, g, b) == (0, 0, 0) else (r, g, b, a) for r, g, b, a in data]
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-white.png")
        new_image_path = os.path.join(white_folder, new_image_name)
        img.save(new_image_path)

# Rozpakowanie i zmiana nazw
extract_and_rename(target_zip, black_dir, white_dir)

print(f"Pliki wypakowane do folderu: {black_dir}")
print(f"Przetworzone pliki zapisane w folderze: {white_dir}")
