import os
from PIL import Image, ImageChops  # 关键修正：引入 ImageChops

def trim_whitespace(img):
    """
    自动裁剪图片周围的空白/透明区域
    原理：计算当前图片与纯色背景的差异，根据差异获取边界框
    """
    # 创建一张跟原图一样大小、颜色的纯色底图（取左上角0,0的颜色作为基准色）
    bg = Image.new(img.mode, img.size, img.getpixel((0,0)))
    
    # 计算原图和纯色底图的差异（关键修正：使用 ImageChops.difference）
    diff = ImageChops.difference(img, bg)
    
    # 获取非零区域的边界框
    bbox = diff.getbbox()
    
    if bbox:
        return img.crop(bbox)
    return img

def split_image(image_path, output_folder, rows=4, cols=6):
    if not os.path.exists(image_path):
        print(f"错误：找不到文件 {image_path}")
        return

    img = Image.open(image_path)
    w, h = img.size
    
    item_w = w // cols
    item_h = h // rows

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    count = 0
    print(f"开始切割：{rows}行 x {cols}列...")

    for i in range(rows):
        for j in range(cols):
            left = j * item_w
            upper = i * item_h
            right = left + item_w
            lower = upper + item_h
            
            # 粗切
            crop_img = img.crop((left, upper, right, lower))
            
            # 精修（去白边）
            final_img = trim_whitespace(crop_img)
            
            count += 1
            filename = f"{output_folder}/emoji_{count:02d}.png"
            final_img.save(filename)
            print(f"已保存: {filename}")

    print(f"✅ 处理完成！共生成 {count} 张表情包。")

if __name__ == "__main__":
    # 记得改文件名
    img_file = "image_me.png" 
    split_image(img_file, "我的表情包")