let camera, scene, renderer, controls;
const objects = [];
let isViewingImage = false;
let currentVideo = null;
let viewingObject = null;
let originalPosition = new THREE.Vector3();
let originalRotation = new THREE.Euler();
let raycaster;
let mouse;
let descriptions = {}; // 存储图片描述

// 将走廊尺寸定义为全局常量
const CORRIDOR_LENGTH = 50;
const CORRIDOR_WIDTH = 6;
const CORRIDOR_HEIGHT = 4;

function init() {
    // 加载描述文件
    loadDescriptions();
    
    scene = new THREE.Scene();
    // 更深的黑色背景
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.7;
    camera.position.z = 0;

    // 使用抗锯齿渲染器
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // 启用阴影
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // 优化光照系统
    const ambientLight = new THREE.AmbientLight(0x1a1a1a, 0.3); // 稍微降低环境光
    scene.add(ambientLight);

    // 添加多个聚光灯
    const spotLights = [];
    const spotLightParams = [
        // 走廊中央的主光源
        { pos: [0, CORRIDOR_HEIGHT - 0.2, 0], intensity: 0.7, color: 0xffffff },
        { pos: [0, CORRIDOR_HEIGHT - 0.2, -CORRIDOR_LENGTH/4], intensity: 0.7, color: 0xffffff },
        { pos: [0, CORRIDOR_HEIGHT - 0.2, -CORRIDOR_LENGTH/2], intensity: 0.7, color: 0xffffff },
        { pos: [0, CORRIDOR_HEIGHT - 0.2, -CORRIDOR_LENGTH*3/4], intensity: 0.7, color: 0xffffff },
        
        // 左右墙画作的专门照明
        // 左墙画作灯光
        { pos: [-CORRIDOR_WIDTH/2 + 1, CORRIDOR_HEIGHT - 0.5, -5], intensity: 0.8, color: 0xfff5e6, angle: Math.PI/6 },
        { pos: [-CORRIDOR_WIDTH/2 + 1, CORRIDOR_HEIGHT - 0.5, -15], intensity: 0.8, color: 0xfff5e6, angle: Math.PI/6 },
        { pos: [-CORRIDOR_WIDTH/2 + 1, CORRIDOR_HEIGHT - 0.5, -25], intensity: 0.8, color: 0xfff5e6, angle: Math.PI/6 },
        { pos: [-CORRIDOR_WIDTH/2 + 1, CORRIDOR_HEIGHT - 0.5, -35], intensity: 0.8, color: 0xfff5e6, angle: Math.PI/6 },
        
        // 右墙画作灯光
        { pos: [CORRIDOR_WIDTH/2 - 1, CORRIDOR_HEIGHT - 0.5, -5], intensity: 0.8, color: 0xfff5e6, angle: Math.PI/6 },
        { pos: [CORRIDOR_WIDTH/2 - 1, CORRIDOR_HEIGHT - 0.5, -15], intensity: 0.8, color: 0xfff5e6, angle: Math.PI/6 },
        { pos: [CORRIDOR_WIDTH/2 - 1, CORRIDOR_HEIGHT - 0.5, -25], intensity: 0.8, color: 0xfff5e6, angle: Math.PI/6 },
        { pos: [CORRIDOR_WIDTH/2 - 1, CORRIDOR_HEIGHT - 0.5, -35], intensity: 0.8, color: 0xfff5e6, angle: Math.PI/6 }
    ];

    spotLightParams.forEach(params => {
        const spotLight = new THREE.SpotLight(params.color || 0xffffff, params.intensity);
        spotLight.position.set(...params.pos);
        spotLight.angle = params.angle || Math.PI/4;
        spotLight.penumbra = 0.4;
        spotLight.decay = 1.5;
        spotLight.distance = params.distance || 15;
        spotLight.castShadow = true;

        // 优化阴影质量
        if(spotLight.shadow) {
            spotLight.shadow.mapSize.width = 1024;
            spotLight.shadow.mapSize.height = 1024;
            spotLight.shadow.camera.near = 0.5;
            spotLight.shadow.camera.far = 20;
            spotLight.shadow.bias = -0.001;
        }

        scene.add(spotLight);
        spotLights.push(spotLight);

        // 添加光晕效果（可选）
        const spriteMaterial = new THREE.SpriteMaterial({
            map: new THREE.TextureLoader().load('images/flower/glow.png'),
            color: params.color || 0xffffff,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1, 1, 1);
        sprite.position.copy(spotLight.position);
        scene.add(sprite);
    });

    // 创建走廊
    createCorridor();

    // 修改控制器初始化
    controls = new THREE.PointerLockControls(camera, document.body);

    // 添加点击事件监听器
    const blocker = document.createElement('div');
    blocker.style.position = 'fixed';
    blocker.style.width = '100%';
    blocker.style.height = '100%';
    blocker.style.background = 'rgba(0,0,0,0.5)';
    blocker.style.cursor = 'pointer';
    blocker.style.zIndex = '999';
    blocker.style.display = 'flex';
    blocker.style.justifyContent = 'center';
    blocker.style.alignItems = 'center';
    blocker.style.color = 'white';
    blocker.style.fontSize = '24px';
    blocker.style.fontFamily = "'Microsoft YaHei', '微软雅黑', sans-serif";
    blocker.textContent = '点击进入画廊';
    document.body.appendChild(blocker);

    // 点击进入控制模式
    blocker.addEventListener('click', function() {
        controls.lock();
        blocker.style.display = 'none';
    });

    // 监听锁定状态变化
    document.addEventListener('pointerlockchange', function() {
        if (document.pointerLockElement === document.body) {
            blocker.style.display = 'none';
        } else if (!isViewingImage) {
            blocker.style.display = 'flex';
        }
    });

    // 监听锁定错误
    document.addEventListener('pointerlockerror', function() {
        console.error('指针锁定失败');
    });

    // 初始化射线检测器和鼠标位置
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 修改点击事件监听
    document.addEventListener('click', onDocumentClick);

    // 添加键盘控制
    document.addEventListener('keydown', onKeyDown);

    // 添加控制说明面板
    createControlPanel();

    // 创建控制按钮
    const controlButtons = createControlButtons();

    // 添加标题栏
    createTitleBar();
}

// 加载描述文件
function loadDescriptions() {
    fetch('des/des.txt')
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            lines.forEach(line => {
                if (line.trim() !== '') {
                    const parts = line.split('===>');
                    if (parts.length === 2) {
                        const key = parts[0].trim();
                        const value = parts[1].trim();
                        descriptions[key] = value;
                    }
                }
            });
        })
        .catch(error => console.error('加载描述文件失败:', error));
}

// 创建标题栏
function createTitleBar() {
    const titleBar = document.createElement('div');
    titleBar.style.position = 'fixed';
    titleBar.style.top = '20px';
    titleBar.style.left = '50%';
    titleBar.style.transform = 'translateX(-50%)';
    titleBar.style.padding = '10px 30px';
    titleBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    titleBar.style.color = 'white';
    titleBar.style.fontFamily = "'Microsoft YaHei', '微软雅黑', sans-serif";
    titleBar.style.fontSize = '24px';
    titleBar.style.fontWeight = 'bold';
    titleBar.style.borderRadius = '5px';
    titleBar.style.zIndex = '1000';
    titleBar.style.textAlign = 'center';
    titleBar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    titleBar.textContent = '蘑菇线上画展';
    document.body.appendChild(titleBar);
}

function createCorridor() {
    // 使用全局常量
    const corridorLength = CORRIDOR_LENGTH;
    const corridorWidth = CORRIDOR_WIDTH;
    const corridorHeight = CORRIDOR_HEIGHT;
    
    // 创建走廊墙壁
    const wallGeometry = new THREE.BoxGeometry(0.2, corridorHeight, corridorLength);
    const wallMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0a0a0a,
        shininess: 30,
        specular: 0x222222,
        reflectivity: 0.5,
        emissive: 0x080808,
        emissiveIntensity: 0.1
    });
    
    // 左墙
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-corridorWidth/2, corridorHeight/2, -corridorLength/2);
    scene.add(leftWall);
    
    // 右墙
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(corridorWidth/2, corridorHeight/2, -corridorLength/2);
    scene.add(rightWall);

    // 添加画作
    const loader = new THREE.TextureLoader();
    const spacing = 5;  // 增加画作间距

    // 设置渲染器的各向异性过滤
    renderer.capabilities.getMaxAnisotropy();
    
    // 在左右墙上添加画作
    for(let i = 0; i < 10; i++) {
        const index = i;
        loader.load(`images/flower/painting${i+1}.jpg`, function(texture) {
            // 优化纹理设置
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            
            // 计算保持原始宽高比的尺寸
            const imageAspect = texture.image.width / texture.image.height;
            let paintingWidth = 2.5;
            let paintingHeight = paintingWidth / imageAspect;
            
            // 如果高度超过限制，则按高度计算宽度
            const maxHeight = 2.2; // 最大高度限制
            if (paintingHeight > maxHeight) {
                paintingHeight = maxHeight;
                paintingWidth = paintingHeight * imageAspect;
            }
            
            const paintingGeometry = new THREE.PlaneGeometry(paintingWidth, paintingHeight);
            const paintingMaterial = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                opacity: 1
            });
            
            // 左墙画作
            const leftPainting = new THREE.Mesh(paintingGeometry, paintingMaterial);
            leftPainting.position.set(-corridorWidth/2 + 0.11, corridorHeight/2, -i * spacing);
            leftPainting.rotation.y = Math.PI/2;
            leftPainting.userData = { 
                isArtwork: true, 
                index: index,
                side: 'left'
            };
            scene.add(leftPainting);
            objects.push(leftPainting);
            
            // 右墙画作
            const rightPainting = new THREE.Mesh(paintingGeometry, paintingMaterial);
            rightPainting.position.set(corridorWidth/2 - 0.11, corridorHeight/2, -i * spacing);
            rightPainting.rotation.y = -Math.PI/2;
            rightPainting.userData = { 
                isArtwork: true, 
                index: index,
                side: 'right'
            };
            scene.add(rightPainting);
            objects.push(rightPainting);
        });
    }

    // 添加地板
    const floorGeometry = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x050505,
        shininess: 50,
        specular: 0x333333,
        reflectivity: 0.8,
        emissive: 0x080808,
        emissiveIntensity: 0.05
    });

    // 添加地板纹理
    const floorTexture = new THREE.TextureLoader().load('images/flower/floor.jpg'); // 修改为flower子文件夹
    if (floorTexture) {
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(4, 20);
        floorMaterial.map = floorTexture;
    }

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -corridorLength/2);
    scene.add(floor);

    // 添加天花板
    const ceiling = new THREE.Mesh(floorGeometry, floorMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, corridorHeight, -corridorLength/2);
    scene.add(ceiling);

    // 为每个画作添加专门的照明
    objects.forEach((painting, index) => {
        const side = painting.userData.side;
        const pos = painting.position;
        
        // 为每个画作添加点光源
        const pointLight = new THREE.PointLight(0xfff5e6, 0.4);
        pointLight.position.set(
            pos.x + (side === 'left' ? 0.5 : -0.5),
            pos.y + 0.5,
            pos.z
        );
        pointLight.distance = 3;
        pointLight.decay = 2;
        scene.add(pointLight);
    });
}

function onDocumentClick(event) {
    // 只在非锁定状态下检测画作点击
    if (!document.pointerLockElement && !isViewingImage) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            if (clickedObject.userData.isArtwork) {
                viewImage(clickedObject);
            }
        }
    }
}

function viewImage(object) {
    if (isViewingImage) return;
    
    isViewingImage = true;
    viewingObject = object;
    
    if (document.pointerLockElement === document.body) {
        controls.unlock();
    }

    // 存储原始位置和旋转
    originalPosition.copy(camera.position);
    originalRotation.copy(camera.rotation);

    // 计算新的相机位置
    const targetPosition = object.position.clone();
    // 增加相机与画作的距离
    const offset = object.userData.side === 'left' ? 3.5 : -3.5; // 增加偏移距离
    targetPosition.x += offset;
    
    // 调整相机高度以更好地查看画作
    targetPosition.y = object.position.y;

    // 创建更强的背景虚化效果，但不影响画作亮度
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 0.1, 15);

    // 为当前查看的画作添加专门的照明
    const viewLight = new THREE.SpotLight(0xffffff, 1.0);
    viewLight.position.set(
        targetPosition.x,
        targetPosition.y + 1,
        targetPosition.z
    );
    viewLight.target = object;
    viewLight.angle = Math.PI/3;
    viewLight.penumbra = 0.5;
    viewLight.decay = 0;
    viewLight.distance = 10;
    scene.add(viewLight);

    // 存储viewLight以便后续移除
    object.userData.viewLight = viewLight;

    // 调整画作材质，确保在查看时保持明亮
    const originalMaterial = object.material;
    object.material = new THREE.MeshBasicMaterial({
        map: originalMaterial.map,
        transparent: true,
        opacity: 1,
    });
    object.userData.originalMaterial = originalMaterial;

    // 计算合适的放大比例
    const texture = object.material.map;
    const imageAspect = texture.image.width / texture.image.height;
    
    // 获取视口尺寸（留出30%边距）
    const viewportWidth = window.innerWidth * 0.7;
    const viewportHeight = window.innerHeight * 0.7;
    
    // 计算当前图片在3D空间中的实际尺寸
    const currentWidth = object.geometry.parameters.width;
    const currentHeight = object.geometry.parameters.height;
    
    // 计算需要的缩放比例，减小系数以获得更合适的大小
    const scaleX = viewportWidth / (currentWidth * 70); // 从100改为70
    const scaleY = viewportHeight / (currentHeight * 70); // 从100改为70
    
    // 使用较小的缩放比例，确保图片完全适应视口
    const targetScale = Math.min(scaleX, scaleY, 2.5);

    // 放大效果
    const scale = { value: 1 };
    new TWEEN.Tween(scale)
        .to({ value: targetScale }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            object.scale.set(scale.value, scale.value, 1);
        })
        .start();

    // 调整其他画作的透明度
    objects.forEach(obj => {
        if (obj !== object) {
            new TWEEN.Tween(obj.material)
                .to({ opacity: 0.3 }, 1000)
                .start();
            obj.material.transparent = true;
        }
    });

    // 如果是第3或第4张图片，播放视频
    if (object.userData.index === 2 || object.userData.index === 3) {
        playVideo(object.userData.index);
    }

    // 相机移动效果
    new TWEEN.Tween(camera.position)
        .to(targetPosition, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();

    // 修改相机旋转效果
    const lookAtPosition = object.position.clone();
    const matrix = new THREE.Matrix4();
    matrix.lookAt(
        new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
        new THREE.Vector3(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z),
        new THREE.Vector3(0, 1, 0)
    );
    
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromRotationMatrix(matrix);
    
    const targetEuler = new THREE.Euler();
    targetEuler.setFromQuaternion(targetQuaternion, 'YXZ');

    new TWEEN.Tween(camera.rotation)
        .to({
            x: targetEuler.x,
            y: targetEuler.y,
            z: targetEuler.z
        }, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();

    // 更新控制面板可见性
    updatePanelVisibility();
    updateButtonsVisibility();

    // 添加图片描述
    const descriptionKey = `painting${object.userData.index + 1}`;
    const descriptionText = descriptions[descriptionKey] || '暂无描述';
    
    const descriptionContainer = document.createElement('div');
    descriptionContainer.style.position = 'fixed';
    descriptionContainer.style.top = '80px';
    descriptionContainer.style.left = '50%';
    descriptionContainer.style.transform = 'translateX(-50%)';
    descriptionContainer.style.padding = '15px 25px';
    descriptionContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    descriptionContainer.style.color = 'white';
    descriptionContainer.style.fontFamily = "'Microsoft YaHei', '微软雅黑', sans-serif";
    descriptionContainer.style.fontSize = '18px';
    descriptionContainer.style.borderRadius = '5px';
    descriptionContainer.style.zIndex = '1000';
    descriptionContainer.style.maxWidth = '80%';
    descriptionContainer.style.textAlign = 'center';
    descriptionContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    descriptionContainer.style.opacity = '0';
    descriptionContainer.style.transition = 'opacity 0.5s ease';
    descriptionContainer.textContent = descriptionText;
    document.body.appendChild(descriptionContainer);
    
    // 存储描述容器引用
    object.userData.descriptionContainer = descriptionContainer;
    
    // 淡入显示描述
    setTimeout(() => {
        descriptionContainer.style.opacity = '1';
    }, 500);
}

function exitView() {
    if (!isViewingImage) return;

    // 保存对描述容器的引用
    const descriptionContainer = viewingObject.userData.descriptionContainer;

    // 移除专门的照明
    if (viewingObject.userData.viewLight) {
        scene.remove(viewingObject.userData.viewLight);
        viewingObject.userData.viewLight = null;
    }

    // 恢复原始材质
    if (viewingObject.userData.originalMaterial) {
        viewingObject.material = viewingObject.userData.originalMaterial;
        viewingObject.userData.originalMaterial = null;
    }

    // 停止视频播放
    if (currentVideo) {
        currentVideo.style.opacity = '0';
        setTimeout(() => {
            currentVideo.remove();
            currentVideo = null;
        }, 500);
    }

    // 恢复画作大小
    const scale = { value: viewingObject.scale.x };
    new TWEEN.Tween(scale)
        .to({ value: 1 }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            viewingObject.scale.set(scale.value, scale.value, 1);
        })
        .start();

    // 恢复其他画作的透明度
    objects.forEach(obj => {
        if (obj !== viewingObject) {
            new TWEEN.Tween(obj.material)
                .to({ opacity: 1 }, 1000)
                .start();
        }
    });

    // 恢复相机位置
    new TWEEN.Tween(camera.position)
        .to(originalPosition, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();

    // 修改相机旋转恢复部分
    new TWEEN.Tween(camera.rotation)
        .to({
            x: originalRotation.x,
            y: originalRotation.y,
            z: originalRotation.z
        }, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start()
        .onComplete(() => {
            isViewingImage = false;
            viewingObject = null;
            scene.fog = null;
            updateButtonsVisibility();
            
            // 不要自动锁定，让用户手动点击进入
            const blocker = document.querySelector('div[style*="position: fixed"]');
            if (blocker) {
                blocker.style.display = 'flex';
            }

            // 移除描述容器 - 使用之前保存的引用
            if (descriptionContainer) {
                descriptionContainer.style.opacity = '0';
                setTimeout(() => {
                    descriptionContainer.remove();
                }, 500);
            }
        });
}

function playVideo(index) {
    const video = document.createElement('video');
    video.src = `audio/video${index + 1}.mp4`;
    video.autoplay = true;
    
    // 创建视频容器
    const videoContainer = document.createElement('div');
    videoContainer.style.position = 'fixed';
    videoContainer.style.top = '0';
    videoContainer.style.left = '0';
    videoContainer.style.width = '100%';
    videoContainer.style.height = '100%';
    videoContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    videoContainer.style.zIndex = '1000';
    videoContainer.style.display = 'flex';
    videoContainer.style.justifyContent = 'center';
    videoContainer.style.alignItems = 'center';
    videoContainer.style.transition = 'opacity 0.5s';

    // 设置视频样式
    video.style.maxWidth = '90%';
    video.style.maxHeight = '90%';
    video.style.objectFit = 'contain';
    video.style.borderRadius = '8px';
    video.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';

    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '20px';
    closeButton.style.right = '20px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '30px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '10px';
    closeButton.style.zIndex = '1001';
    closeButton.onclick = () => {
        exitView();
    };

    // 组装视频界面
    videoContainer.appendChild(video);
    videoContainer.appendChild(closeButton);
    document.body.appendChild(videoContainer);
    currentVideo = videoContainer; // 更新currentVideo引用

    // 添加点击背景关闭功能
    videoContainer.addEventListener('click', (e) => {
        if (e.target === videoContainer) {
            exitView();
        }
    });
}

function onKeyDown(event) {
    // 确保 ESC 键的处理优先级最高
    if (event.code === 'Escape') {
        if (isViewingImage) {
            exitView();
            return;
        }
    }

    // 只有在非查看模式下才处理移动控制
    if (!isViewingImage) {
        const speed = 0.1;
        switch(event.code) {
            case 'ArrowUp':
            case 'KeyW':
                controls.moveForward(speed);
                break;
            case 'ArrowDown':
            case 'KeyS':
                controls.moveForward(-speed);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                controls.moveRight(-speed);
                break;
            case 'ArrowRight':
            case 'KeyD':
                controls.moveRight(speed);
                break;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}

// 窗口大小改变时调整画面
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

// 添加创建控制面板的函数
function createControlPanel() {
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '20px';
    panel.style.left = '20px';
    panel.style.padding = '15px 20px';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    panel.style.color = 'white';
    panel.style.fontFamily = "'Microsoft YaHei', '微软雅黑', sans-serif";
    panel.style.fontSize = '16px';
    panel.style.borderRadius = '5px';
    panel.style.zIndex = '1000';
    panel.style.userSelect = 'none';
    panel.style.lineHeight = '2';
    panel.style.minWidth = '200px';

    // 添加标题
    const title = document.createElement('div');
    title.textContent = '控制说明:';
    title.style.marginBottom = '10px';
    title.style.fontSize = '18px';
    title.style.fontWeight = 'bold';
    panel.appendChild(title);

    // 添加控制说明列表
    const controls = [
        'W/↑ - 前进',
        'S/↓ - 后退',
        'A/← - 左移',
        'D/→ - 右移',
        '鼠标 - 视角控制',
        '点击画作 - 放大查看',
        'Press ESC - 退出放大'
    ];

    controls.forEach(control => {
        const controlItem = document.createElement('div');
        controlItem.textContent = control;
        controlItem.style.color = '#ffffff';
        controlItem.style.fontSize = '16px';
        controlItem.style.marginBottom = '5px';
        panel.appendChild(controlItem);
    });

    document.body.appendChild(panel);

    // 添加渐变效果
    panel.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))';
    panel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    panel.style.transition = 'opacity 0.3s ease';

    // 在进入查看模式时隐藏面板，退出时显示
    window.updatePanelVisibility = function() {
        if (isViewingImage) {
            panel.style.opacity = '0';
            panel.style.pointerEvents = 'none';
        } else {
            panel.style.opacity = '1';
            panel.style.pointerEvents = 'auto';
        }
    };
}

function createControlButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '30px'; // 增加底部距离
    buttonContainer.style.left = '50%';
    buttonContainer.style.transform = 'translateX(-50%)';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '15px'; // 增加按钮间距
    buttonContainer.style.zIndex = '1000';

    // 创建按钮样式
    const buttonStyle = {
        width: '70px', // 增加按钮宽度
        height: '70px', // 增加按钮高度
        border: 'none',
        borderRadius: '35px', // 调整圆角
        background: 'rgba(255, 255, 255, 0.25)',
        color: 'white',
        fontSize: '28px', // 增加字体大小
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'background-color 0.3s',
        fontFamily: "'Microsoft YaHei', '微软雅黑', sans-serif",
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)', // 添加阴影
        WebkitTapHighlightColor: 'transparent', // 移除移动端点击高亮
        userSelect: 'none', // 防止文字被选中
        touchAction: 'manipulation' // 优化触摸操作
    };

    // 创建方向按钮容器
    const directionButtons = document.createElement('div');
    directionButtons.style.display = 'grid';
    directionButtons.style.gridTemplateColumns = 'repeat(3, 70px)'; // 使用网格布局
    directionButtons.style.gap = '15px';
    directionButtons.style.justifyContent = 'center';
    directionButtons.style.alignItems = 'center';

    // 创建按钮
    const buttons = [
        { text: '↑', action: () => controls.moveForward(0.1), gridArea: '1/2' },
        { text: '←', action: () => controls.moveRight(-0.1), gridArea: '2/1' },
        { text: '→', action: () => controls.moveRight(0.1), gridArea: '2/3' },
        { text: '↓', action: () => controls.moveForward(-0.1), gridArea: '2/2' },
        { text: 'ESC', action: () => { if (isViewingImage) exitView(); } }
    ];

    buttons.forEach((btn, index) => {
        const button = document.createElement('button');
        Object.assign(button.style, buttonStyle);
        button.textContent = btn.text;
        
        if (index < 4) {
            // 设置方向按钮的位置
            button.style.gridArea = btn.gridArea;
            directionButtons.appendChild(button);
        } else {
            // ESC 按钮特殊样式
            button.style.background = 'rgba(255, 100, 100, 0.3)';
            button.style.fontSize = '22px';
            button.style.width = '80px'; // ESC按钮稍大
            button.style.height = '80px';
            buttonContainer.appendChild(button);
        }

        // 添加悬停和激活效果
        button.onmouseover = () => {
            button.style.background = btn.text === 'ESC' ? 
                'rgba(255, 100, 100, 0.5)' : 
                'rgba(255, 255, 255, 0.35)';
            button.style.transform = 'scale(1.1)';
        };
        button.onmouseout = () => {
            button.style.background = btn.text === 'ESC' ? 
                'rgba(255, 100, 100, 0.3)' : 
                'rgba(255, 255, 255, 0.25)';
            button.style.transform = 'scale(1)';
        };

        // 添加触摸和点击事件
        let intervalId;
        const startAction = () => {
            button.style.transform = 'scale(0.95)'; // 按下效果
            btn.action();
            intervalId = setInterval(btn.action, 100);
        };
        const stopAction = () => {
            button.style.transform = 'scale(1)'; // 恢复大小
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        button.addEventListener('mousedown', startAction);
        button.addEventListener('mouseup', stopAction);
        button.addEventListener('mouseleave', stopAction);
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startAction();
        });
        button.addEventListener('touchend', stopAction);
    });

    // 将方向按钮容器添加到主容器
    buttonContainer.appendChild(directionButtons);
    document.body.appendChild(buttonContainer);

    // 在查看图片时隐藏方向按钮，只显示ESC按钮
    window.updateButtonsVisibility = function() {
        directionButtons.style.display = isViewingImage ? 'none' : 'grid';
    };

    return buttonContainer;
}

init();
animate(); 