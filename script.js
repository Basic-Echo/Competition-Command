// 全局变量
let awardData = [];
const ADMIN_PASSWORD = 'h20041214';

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
    // 从服务器加载数据
    await initDatabase();
    
    // 根据当前页面执行不同的初始化函数
    if (document.title === '竞赛获奖情况统计') {
        initIndexPage();
    } else if (document.title === '竞赛获奖数据浏览') {
        initBrowsePage();
    }
});

// 从服务器加载数据
async function initDatabase() {
    try {
        const response = await fetch('/api/awards');
        if (!response.ok) throw new Error('服务器响应异常: ' + response.status);
        awardData = await response.json();
        console.log('数据加载完成，当前数据条数:', awardData.length);
    } catch (error) {
        console.error('数据加载失败:', error);
        alert('无法连接到服务器，请确保服务器正在运行');
    }
}

// 首页初始化
function initIndexPage() {
    const competitionModules = document.getElementById('competitionModules');
    const addModuleBtn = document.getElementById('addModule');
    const awardForm = document.getElementById('awardForm');
    const successModal = document.getElementById('successModal');
    const closeModal = document.querySelector('.modal .close');
    const resetFormBtn = document.getElementById('resetFormBtn');
    const browseDataBtn = document.getElementById('browseDataBtn');

    // 添加一个默认的竞赛模块
    addCompetitionModule();

    // 添加模块按钮点击事件
    addModuleBtn.addEventListener('click', function() {
        addCompetitionModule();
        clearErrorSummary();
    });

    // 表单提交事件
    awardForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            submitForm();
            // 注意：成功弹窗现在在submitForm函数内部显示，以确保在所有图片处理完成后再显示
        }
    });

    // 关闭弹窗
    closeModal.addEventListener('click', function() {
        successModal.style.display = 'none';
    });

    // 点击弹窗外部关闭弹窗
    window.addEventListener('click', function(e) {
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });

    // 重置表单按钮
    resetFormBtn.addEventListener('click', function() {
        successModal.style.display = 'none';
        awardForm.reset();
        // 保留一个空的竞赛模块
        competitionModules.innerHTML = '';
        addCompetitionModule();
        clearErrorSummary();
    });

    // 查看数据按钮
    browseDataBtn.addEventListener('click', function() {
        window.location.href = 'browse.html';
    });
}

// 添加竞赛模块
function addCompetitionModule() {
    const competitionModules = document.getElementById('competitionModules');
    const moduleCount = competitionModules.children.length;

    // 生成年份选项（只包含2023-2027）
    let yearOptions = '<option value="">请选择年</option>';
    for (let year = 2023; year <= 2027; year++) {
        yearOptions += `<option value="${year}">${year}年</option>`;
    }

    // 生成月份选项
    let monthOptions = '<option value="">请选择月</option>';
    for (let month = 1; month <= 12; month++) {
        monthOptions += `<option value="${month.toString().padStart(2, '0')}">${month}月</option>`;
    }

    const moduleDiv = document.createElement('div');
    moduleDiv.className = 'competition-module';
    moduleDiv.innerHTML = `
        <h3>竞赛 ${moduleCount + 1}</h3>
        <button type="button" class="delete-module" onclick="deleteModule(this)">&times;</button>
        <div class="form-group">
            <label for="year-${moduleCount}">获奖年月 *</label>
            <div class="date-selector">
                <select id="year-${moduleCount}" name="year-${moduleCount}" required>
                    ${yearOptions}
                </select>
                <select id="month-${moduleCount}" name="month-${moduleCount}" required>
                    ${monthOptions}
                </select>
            </div>
            <span class="error-message" id="dateError-${moduleCount}"></span>
        </div>
        <div class="form-group">
            <label for="competition-${moduleCount}">竞赛名称 *</label>
            <input type="text" id="competition-${moduleCount}" name="competition-${moduleCount}" required>
            <span class="error-message" id="competitionError-${moduleCount}"></span>
        </div>
        <div class="form-group">
            <label for="level-${moduleCount}">竞赛级别 *</label>
            <select id="level-${moduleCount}" name="level-${moduleCount}" required>
                <option value="">请选择级别</option>
                <option value="校级">校级</option>
                <option value="省级">省级</option>
                <option value="国家级">国家级</option>
            </select>
            <span class="error-message" id="levelError-${moduleCount}"></span>
        </div>
        <div class="form-group">
            <label for="award-${moduleCount}">获奖等级 *</label>
            <select id="award-${moduleCount}" name="award-${moduleCount}" required>
                <option value="">请选择等级</option>
                <option value="特等奖">特等奖</option>
                <option value="一等奖">一等奖</option>
                <option value="二等奖">二等奖</option>
                <option value="三等奖">三等奖</option>
            </select>
            <span class="error-message" id="awardError-${moduleCount}"></span>
        </div>
        <div class="form-group">
            <label for="certificate-${moduleCount}">获奖凭证（图片）</label>
            <div class="file-upload-container">
                <input type="file" id="certificate-${moduleCount}" name="certificate-${moduleCount}" accept="image/*">
                <button type="button" class="remove-file-btn" onclick="removeFile(${moduleCount})" style="display: none;">删除</button>
            </div>
            <div class="image-preview" id="preview-${moduleCount}"></div>
            <span class="error-message" id="certificateError-${moduleCount}"></span>
        </div>
    `;

    competitionModules.appendChild(moduleDiv);
    
    // 添加图片预览功能
    const fileInput = document.getElementById(`certificate-${moduleCount}`);
    const preview = document.getElementById(`preview-${moduleCount}`);
    
    fileInput.addEventListener('change', function() {
        previewImage(this, moduleCount);
    });

    // 添加粘贴图片功能
    fileInput.addEventListener('paste', function(e) {
        handleImagePaste(e, moduleCount);
    });

    // 为文件输入框的父容器添加点击事件，方便用户点击上传
    const fileContainer = fileInput.parentElement;
    fileContainer.style.position = 'relative';
    fileContainer.style.cursor = 'pointer';
}

// 图片压缩功能（增强版）
function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        // 如果文件小于100KB，直接返回原图
        if (file.size < 100 * 1024) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                let width = img.width;
                let height = img.height;

                // 计算缩放比例
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                // 创建Canvas进行压缩
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // 设置图片质量
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // 绘制压缩后的图片
                ctx.drawImage(img, 0, 0, width, height);

                // 将Canvas转换为Blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        // 如果压缩后文件仍然很大，尝试降低质量再次压缩
                        if (blob.size > 500 * 1024) {
                            canvas.toBlob((recompressedBlob) => {
                                if (recompressedBlob) {
                                    resolve(recompressedBlob);
                                } else {
                                    resolve(blob); // 如果再次压缩失败，返回第一次压缩的结果
                                }
                            }, file.type, 0.6);
                        } else {
                            resolve(blob);
                        }
                    } else {
                        reject(new Error('图片压缩失败'));
                    }
                }, file.type, quality);
            };
            img.onerror = function() {
                reject(new Error('图片加载失败'));
            };
        };
        reader.onerror = function() {
            reject(new Error('文件读取失败'));
        };
    });
}

// 图片预览功能
function previewImage(input, moduleId) {
    const preview = document.getElementById(`preview-${moduleId}`);
    const errorElement = document.getElementById(`certificateError-${moduleId}`);
    
    preview.innerHTML = '';
    errorElement.textContent = '';
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // 检查文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            errorElement.textContent = '图片大小不能超过10MB';
            return;
        }
        
        // 检查文件类型
        if (!file.type.match('image.*')) {
            errorElement.textContent = '请选择图片文件';
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
            preview.style.display = 'block';
            // 显示删除按钮
            const removeBtn = document.querySelector(`#certificate-${moduleId}`).nextElementSibling;
            removeBtn.style.display = 'inline-block';
        };
        
        reader.readAsDataURL(file);
    }
}

// 处理粘贴图片功能
function handleImagePaste(e, moduleId) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const fileInput = document.getElementById(`certificate-${moduleId}`);
    const errorElement = document.getElementById(`certificateError-${moduleId}`);
    
    errorElement.textContent = '';
    
    // 遍历剪贴板中的项目
    for (let index in items) {
        const item = items[index];
        // 检查是否为图片
        if (item.kind === 'file' && item.type.match('image.*')) {
            const file = item.getAsFile();
            
            // 检查文件大小（限制为10MB）
            if (file.size > 10 * 1024 * 1024) {
                errorElement.textContent = '图片大小不能超过10MB';
                return;
            }
            
            // 创建一个DataTransfer对象来模拟文件选择
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            
            // 设置文件输入框的值
            fileInput.files = dataTransfer.files;
            
            // 调用预览函数
            previewImage(fileInput, moduleId);
            
            break;
        }
    }
}

// 删除已选择的文件
function removeFile(moduleId) {
    const fileInput = document.getElementById(`certificate-${moduleId}`);
    const preview = document.getElementById(`preview-${moduleId}`);
    const removeBtn = document.querySelector(`#certificate-${moduleId}`).nextElementSibling;
    const errorElement = document.getElementById(`certificateError-${moduleId}`);
    
    // 清空文件输入
    fileInput.value = '';
    
    // 清空预览
    preview.innerHTML = '';
    preview.style.display = 'none';
    
    // 隐藏删除按钮
    removeBtn.style.display = 'none';
    
    // 清空错误信息
    errorElement.textContent = '';
}

// 删除竞赛模块
function deleteModule(btn) {
    const competitionModules = document.getElementById('competitionModules');
    if (competitionModules.children.length > 1) {
        btn.parentElement.remove();
        // 重新编号
        updateModuleNumbers();
    } else {
        alert('至少需要保留一个竞赛信息模块！');
    }
}

// 更新模块编号
function updateModuleNumbers() {
    const competitionModules = document.getElementById('competitionModules');
    const modules = competitionModules.children;

    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const title = module.querySelector('h3');
        title.textContent = `竞赛 ${i + 1}`;

        // 获取所有的表单组
        const formGroups = module.querySelectorAll('.form-group');
        
        // 更新年级
        const gradeGroup = formGroups[0];
        const gradeSelect = gradeGroup.querySelector('select');
        gradeSelect.id = `grade-${i}`;
        gradeSelect.name = `grade-${i}`;
        const gradeError = gradeGroup.querySelector('.error-message');
        gradeError.id = `gradeError-${i}`;
        
        // 更新竞赛名称
        const competitionGroup = formGroups[1];
        const competitionInput = competitionGroup.querySelector('input');
        competitionInput.id = `competition-${i}`;
        competitionInput.name = `competition-${i}`;
        const competitionError = competitionGroup.querySelector('.error-message');
        competitionError.id = `competitionError-${i}`;
        
        // 更新竞赛级别
        const levelGroup = formGroups[2];
        const levelSelect = levelGroup.querySelector('select');
        levelSelect.id = `level-${i}`;
        levelSelect.name = `level-${i}`;
        const levelError = levelGroup.querySelector('.error-message');
        levelError.id = `levelError-${i}`;
        
        // 更新获奖等级
        const awardGroup = formGroups[3];
        const awardSelect = awardGroup.querySelector('select');
        awardSelect.id = `award-${i}`;
        awardSelect.name = `award-${i}`;
        const awardError = awardGroup.querySelector('.error-message');
        awardError.id = `awardError-${i}`;
        
        // 更新证书
        const certificateGroup = formGroups[4];
        const certificateInput = certificateGroup.querySelector('input[type="file"]');
        certificateInput.id = `certificate-${i}`;
        certificateInput.name = `certificate-${i}`;
        const previewDiv = certificateGroup.querySelector('.image-preview');
        previewDiv.id = `preview-${i}`;
        const certificateError = certificateGroup.querySelector('.error-message');
        certificateError.id = `certificateError-${i}`;
        
        // 重新绑定文件上传事件
        certificateInput.addEventListener('change', function() {
            previewImage(this, i);
        });
    }
}

// 表单验证
function validateForm() {
    let isValid = true;
    const errorMessages = [];

    // 清除所有错误信息
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    // 验证姓名
    const name = document.getElementById('name').value.trim();
    if (!name) {
        const errorMsg = '请输入姓名';
        document.getElementById('nameError').textContent = errorMsg;
        errorMessages.push(errorMsg);
        isValid = false;
    }

    // 验证专业
    const major = document.getElementById('major').value;
    if (!major) {
        const errorMsg = '请选择专业';
        document.getElementById('majorError').textContent = errorMsg;
        errorMessages.push(errorMsg);
        isValid = false;
    }

    // 验证竞赛信息
    const competitionModules = document.getElementById('competitionModules');
    for (let i = 0; i < competitionModules.children.length; i++) {
        const moduleErrors = [];
        
        // 验证日期（年、月都必须选择）
        const year = document.getElementById(`year-${i}`).value;
        const month = document.getElementById(`month-${i}`).value;
        
        if (!year || !month) {
            const errorMsg = '请选择完整的获奖年月';
            document.getElementById(`dateError-${i}`).textContent = errorMsg;
            moduleErrors.push(errorMsg);
            isValid = false;
        }

        // 验证竞赛名称
        const competition = document.getElementById(`competition-${i}`).value.trim();
        if (!competition) {
            const errorMsg = '请输入竞赛名称';
            document.getElementById(`competitionError-${i}`).textContent = errorMsg;
            moduleErrors.push(errorMsg);
            isValid = false;
        }

        // 验证竞赛级别
        const level = document.getElementById(`level-${i}`).value;
        if (!level) {
            const errorMsg = '请选择竞赛级别';
            document.getElementById(`levelError-${i}`).textContent = errorMsg;
            moduleErrors.push(errorMsg);
            isValid = false;
        }

        // 验证获奖等级
        const award = document.getElementById(`award-${i}`).value;
        if (!award) {
            const errorMsg = '请选择获奖等级';
            document.getElementById(`awardError-${i}`).textContent = errorMsg;
            moduleErrors.push(errorMsg);
            isValid = false;
        }
        
        // 如果当前模块有错误，添加到总错误信息中
        if (moduleErrors.length > 0) {
            errorMessages.push(`竞赛 ${i + 1} 的问题: ${moduleErrors.join('、')}`);
        }
    }

    // 如果有错误，显示汇总提示
    if (!isValid) {
        showErrorSummary(errorMessages);
    }

    return isValid;
}

// 显示错误汇总
function showErrorSummary(errorMessages) {
    // 检查是否已存在错误汇总元素
    let errorSummary = document.getElementById('errorSummary');
    if (!errorSummary) {
        // 创建错误汇总元素
        errorSummary = document.createElement('div');
        errorSummary.id = 'errorSummary';
        errorSummary.className = 'error-summary';
        
        // 将错误汇总添加到表单顶部
        const form = document.getElementById('awardForm');
        form.insertBefore(errorSummary, form.firstChild);
    }
    
    // 构建错误信息HTML
    let errorHtml = `
        <div class="error-header">
            <i class="error-icon">⚠️</i>
            <h3>请完善以下信息后再提交：</h3>
        </div>
        <ul class="error-list">
    `;
    
    errorMessages.forEach(message => {
        errorHtml += `<li>${message}</li>`;
    });
    
    errorHtml += `</ul>`;
    
    // 更新错误汇总内容
    errorSummary.innerHTML = errorHtml;
    errorSummary.style.display = 'block';
    
    // 滚动到错误汇总
    errorSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 清除错误汇总
function clearErrorSummary() {
    const errorSummary = document.getElementById('errorSummary');
    if (errorSummary) {
        errorSummary.style.display = 'none';
    }
}

// 提交表单
function submitForm() {
    // 首先进行表单验证
    if (!validateForm()) {
        return; // 如果验证不通过，直接返回
    }

    const name = document.getElementById('name').value.trim();
    const major = document.getElementById('major').value;
    const competitionModules = document.getElementById('competitionModules');

    // 收集所有竞赛信息
    const competitions = [];
    const filePromises = [];
    
    for (let i = 0; i < competitionModules.children.length; i++) {
        // 直接从模块中获取表单元素，而不是通过ID查找
        const module = competitionModules.children[i];
        const formGroups = module.querySelectorAll('.form-group');
        const dateSelector = formGroups[0].querySelector('.date-selector');
        const year = dateSelector.querySelector('select:nth-child(1)').value;
        const month = dateSelector.querySelector('select:nth-child(2)').value;
        
        const competition = {
            date: `${year}-${month}`, // 将日期组合为 YYYY-MM 格式（只保存年月）
            competition: formGroups[1].querySelector('input').value.trim(),
            level: formGroups[2].querySelector('select').value,
            award: formGroups[3].querySelector('select').value,
            certificate: null
        };
        
        const fileInput = formGroups[4].querySelector('input[type="file"]');
        if (fileInput.files && fileInput.files[0]) {
            const filePromise = new Promise((resolve) => {
                // 先压缩图片，再转换为Base64
                compressImage(fileInput.files[0])
                    .then(compressedBlob => {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            competition.certificate = e.target.result;
                            resolve();
                        };
                        reader.onerror = function() {
                            // 如果压缩后读取失败，尝试使用原图
                            const originalReader = new FileReader();
                            originalReader.onload = function(e) {
                                competition.certificate = e.target.result;
                                resolve();
                            };
                            originalReader.readAsDataURL(fileInput.files[0]);
                        };
                        reader.readAsDataURL(compressedBlob);
                    })
                    .catch(error => {
                        console.error('图片压缩失败:', error);
                        // 如果压缩失败，使用原图
                        const originalReader = new FileReader();
                        originalReader.onload = function(e) {
                            competition.certificate = e.target.result;
                            resolve();
                        };
                        originalReader.readAsDataURL(fileInput.files[0]);
                    });
            });
            filePromises.push(filePromise);
        }
        
        competitions.push(competition);
    }
    
    // 等待所有图片加载完成
    Promise.all(filePromises).then(async () => {
        // 创建新的记录
        const newRecord = {
            id: Date.now(), // 使用时间戳作为唯一 ID
            name,
            major,
            competitions,
            submitTime: new Date().toLocaleString()
        };

        // 提交到服务器
        try {
            const response = await fetch('/api/awards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord)
            });
            if (!response.ok) throw new Error('服务器响应异常');

            // 将新记录添加到本地缓存
            awardData.push(newRecord);
            console.log('数据保存成功，当前数据条数:', awardData.length);
        } catch (error) {
            console.error('数据保存失败:', error);
            alert('数据保存失败，请检查网络连接后重试');
            return;
        }

        // 显示成功弹窗
        document.getElementById('successModal').style.display = 'block';

        // 更新存储容量显示
        if (typeof updateStorageInfo === 'function') {
            updateStorageInfo();
        }
    });
}

// 全局变量
let isAdmin = false;

// 数据浏览页初始化
function initBrowsePage() {
    const browseSection = document.getElementById('browseSection');
    const filterBtn = document.getElementById('filterBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const editModal = document.getElementById('editModal');
    const closeEditModal = editModal.querySelector('.close');
    const editForm = document.getElementById('editForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminVerifyBtn = document.getElementById('adminVerifyBtn');
    const adminCancelBtn = document.getElementById('adminCancelBtn');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminPasswordError = document.getElementById('adminPasswordError');
    const adminStatus = document.getElementById('adminStatus');

    // 管理员登录验证
    adminVerifyBtn.addEventListener('click', function() {
        if (adminPasswordInput.value === ADMIN_PASSWORD) {
            isAdmin = true;
            adminLoginModal.style.display = 'none';
            adminStatus.textContent = '管理员模式';
            adminLoginBtn.textContent = '退出登录';
            updateAdminControls(true);
            displayAwardData(); // 重新显示数据以显示管理员操作按钮
        } else {
            adminPasswordError.textContent = '密码错误，请重新输入！';
        }
    });

    // 关闭管理员登录弹窗
    adminCancelBtn.addEventListener('click', function() {
        adminLoginModal.style.display = 'none';
    });

    // 点击弹窗关闭按钮
    const adminLoginCloseBtn = adminLoginModal.querySelector('.close');
    if (adminLoginCloseBtn) {
        adminLoginCloseBtn.addEventListener('click', function() {
            adminLoginModal.style.display = 'none';
        });
    }

    // 点击弹窗外部关闭
    adminLoginModal.addEventListener('click', function(e) {
        if (e.target === adminLoginModal) {
            adminLoginModal.style.display = 'none';
        }
    });

    // 筛选按钮
    filterBtn.addEventListener('click', filterData);
    
    // 初始化日期筛选选择器
    initDateFilters();
    
    // 导出Excel按钮
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

    // 重置筛选按钮
    resetFilterBtn.addEventListener('click', function() {
        document.getElementById('filterName').value = '';
        document.getElementById('filterCompetition').value = '';
        document.getElementById('filterLevel').value = '';
        document.getElementById('filterAward').value = '';
        // 重置年月区间筛选
        document.getElementById('filterStartYear').value = '';
        document.getElementById('filterStartMonth').value = '';
        document.getElementById('filterEndYear').value = '';
        document.getElementById('filterEndMonth').value = '';
        displayAwardData();
    });

    // 批量删除按钮
    document.getElementById('batchDeleteBtn').addEventListener('click', confirmBatchDelete);

    // 退出管理员登录
    adminLoginBtn.addEventListener('click', function() {
        if (isAdmin) {
            if (confirm('确定要退出管理员模式吗？')) {
                isAdmin = false;
                adminStatus.textContent = '游客模式';
                adminLoginBtn.textContent = '管理员登录';
                updateAdminControls(false);
                displayAwardData(); // 重新显示数据以隐藏管理员操作按钮
            }
        } else {
            adminLoginModal.style.display = 'block';
            adminPasswordInput.value = '';
            adminPasswordError.textContent = '';
        }
    });

    // 关闭编辑弹窗
    closeEditModal.addEventListener('click', function() {
        editModal.style.display = 'none';
    });
    
    // 初始显示数据（游客模式）
    displayAwardData();
    
    // 更新存储容量显示
    updateStorageInfo();

    // 点击弹窗外部关闭弹窗
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // 取消编辑
    cancelEditBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });
    
    // 删除确认弹窗
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModal = deleteModal.querySelector('.close');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    
    // 关闭删除弹窗
    closeDeleteModal.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    // 取消删除
    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });

    // 提交编辑表单
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveEdit();
    });
}

// 导出Excel功能
function exportToExcel() {
    const filterName = document.getElementById('filterName').value.trim().toLowerCase();
    const filterCompetition = document.getElementById('filterCompetition').value.trim().toLowerCase();
    const filterLevel = document.getElementById('filterLevel').value;
    const filterAward = document.getElementById('filterAward').value;

    // 获取筛选后的数据
    let filteredData = [];
    awardData.forEach(record => {
        record.competitions.forEach(competition => {
            const nameMatch = !filterName || record.name.toLowerCase().includes(filterName);
            const competitionMatch = !filterCompetition || competition.competition.toLowerCase().includes(filterCompetition);
            const levelMatch = !filterLevel || competition.level === filterLevel;
            const awardMatch = !filterAward || competition.award === filterAward;

            if (nameMatch && competitionMatch && levelMatch && awardMatch) {
                filteredData.push({
                    '姓名': record.name,
                    '专业': record.major,
                    '获奖日期': competition.date || '未填写',
                    '竞赛名称': competition.competition,
                    '竞赛级别': competition.level,
                    '获奖等级': competition.award
                });
            }
        });
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filteredData);

    // 设置列宽
    ws['!cols'] = [
        {wch: 10},  // 姓名
        {wch: 10},  // 专业
        {wch: 15},  // 获奖日期
        {wch: 30},  // 竞赛名称
        {wch: 10},  // 竞赛级别
        {wch: 10}   // 获奖等级
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '竞赛获奖数据');

    // 生成Excel文件并下载
    const fileName = `竞赛获奖数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// 更新管理员控制按钮状态
function updateAdminControls(adminMode) {
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const adminColumns = document.querySelectorAll('.admin-col');
    
    if (adminMode) {
        batchDeleteBtn.disabled = false;
        exportExcelBtn.disabled = false;
        adminColumns.forEach(col => col.style.display = 'table-cell');
    } else {
        batchDeleteBtn.disabled = true;
        exportExcelBtn.disabled = true;
        adminColumns.forEach(col => col.style.display = 'none');
    }
}

// 显示获奖数据
function displayAwardData(data = awardData) {
    const tableBody = document.querySelector('#awardTable tbody');
    const noDataMessage = document.getElementById('noDataMessage');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    const selectAllCheckbox = document.getElementById('selectAll');

    tableBody.innerHTML = '';

    // 计算总记录数
    let totalCount = 0;
    data.forEach(record => {
        totalCount += record.competitions.length;
    });

    // 更新结果计数
    document.getElementById('resultCount').querySelector('span').textContent = totalCount;

    if (data.length === 0 || totalCount === 0) {
        noDataMessage.style.display = 'block';
        batchDeleteBtn.disabled = true;
        selectAllCheckbox.checked = false;
        return;
    }

    noDataMessage.style.display = 'none';
    batchDeleteBtn.disabled = true;
    selectAllCheckbox.checked = false;

    data.forEach(record => {
        record.competitions.forEach(competition => {
            const row = document.createElement('tr');
            
            // 处理证书图片显示
            let certificateHtml = '无';
            if (competition.certificate) {
                // 根据管理员权限决定是否显示删除图片按钮
                const removeImageBtn = isAdmin ? `
                    <button class="remove-img-btn" onclick="removeImage(${record.id}, '${competition.competition}')" title="删除图片">×</button>
                ` : '';
                
                certificateHtml = `
                    <div class="certificate-container">
                        <img src="${competition.certificate}" alt="获奖凭证" class="certificate-img" onclick="viewImage('${competition.certificate}')">
                        ${removeImageBtn}
                    </div>
                `;
            }
            
            // 根据管理员权限决定是否显示操作按钮
            const actionButtons = isAdmin ? `
                <button class="action-btn" onclick="editRecord(${record.id}, '${competition.competition}')">修改</button>
                <button class="delete-btn" onclick="confirmDelete(${record.id}, '${competition.competition}')">删除</button>
            ` : '';
            
            row.innerHTML = `
                <td class="admin-col"><input type="checkbox" class="record-checkbox" data-record-id="${record.id}" data-competition="${competition.competition}"></td>
                <td>${record.name}</td>
                <td>${record.major}</td>
                <td>${competition.date || '未填写'}</td>
                <td>${competition.competition}</td>
                <td>${competition.level}</td>
                <td>${competition.award}</td>
                <td>${certificateHtml}</td>
                <td class="admin-col">${actionButtons}</td>
            `;
            tableBody.appendChild(row);
        });
    });
    
    // 绑定复选框事件
    bindCheckboxEvents();
    
    // 更新管理员控制按钮状态
    updateAdminControls(isAdmin);
    
    // 初始化图片查看器
    initImageViewer();
}

// 绑定复选框事件
function bindCheckboxEvents() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const recordCheckboxes = document.querySelectorAll('.record-checkbox');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');

    // 全选/取消全选
    selectAllCheckbox.addEventListener('change', function() {
        recordCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateBatchDeleteButton();
    });

    // 单个复选框事件
    recordCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateBatchDeleteButton();
            // 检查是否所有复选框都被选中
            const allChecked = Array.from(recordCheckboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        });
    });

    // 更新批量删除按钮状态
    function updateBatchDeleteButton() {
        const anyChecked = Array.from(recordCheckboxes).some(cb => cb.checked);
        batchDeleteBtn.disabled = !anyChecked;
    }
}

// 批量删除确认（支持单选和多选）
function confirmBatchDelete() {
    const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert('请至少选择一条记录进行删除！');
        return;
    }

    // 根据选择的记录数显示不同的确认消息
    let confirmMessage;
    if (checkedBoxes.length === 1) {
        const recordId = checkedBoxes[0].dataset.recordId;
        const competition = checkedBoxes[0].dataset.competition;
        confirmMessage = `确定要删除这条记录吗？\n竞赛名称: ${competition}\n此操作不可恢复！`;
    } else {
        confirmMessage = `确定要删除选中的 ${checkedBoxes.length} 条记录吗？此操作不可恢复！`;
    }

    if (confirm(confirmMessage)) {
        // 获取所有要删除的记录
        const recordsToDelete = Array.from(checkedBoxes).map(checkbox => ({
            recordId: parseInt(checkbox.dataset.recordId),
            competition: checkbox.dataset.competition
        }));

        // 执行删除
        let deleteCount = 0;
        recordsToDelete.forEach(item => {
            if (deleteRecord(item.recordId, item.competition)) {
                deleteCount++;
            }
        });

        // 显示成功提示
        alert(`成功删除 ${deleteCount} 条记录！`);

        // 重新应用当前筛选条件并显示数据
        applyCurrentFilters();
    }
}

// 删除图片
async function removeImage(recordId, competitionName) {
    if (confirm('确定要删除这张获奖凭证图片吗？')) {
        const recordIndex = awardData.findIndex(record => record.id === recordId);
        if (recordIndex !== -1) {
            const competitionIndex = awardData[recordIndex].competitions.findIndex(
                comp => comp.competition === competitionName
            );
            if (competitionIndex !== -1) {
                // 删除图片数据
                awardData[recordIndex].competitions[competitionIndex].certificate = null;
                
                try {
                    // 更新服务器上的记录
                    await fetch(`/api/awards/${recordId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(awardData[recordIndex])
                    });

                    // 重新显示数据
                    applyCurrentFilters();

                    // 更新存储容量显示
                    updateStorageInfo();

                    alert('图片删除成功！');
                } catch (error) {
                    console.error('图片删除失败:', error);
                    alert('图片删除失败，请检查网络连接后重试');
                }
            }
        }
    }
}

// 初始化图片查看器
function initImageViewer() {
    const imageViewer = document.getElementById('imageViewer');
    const viewerImage = document.getElementById('viewerImage');
    const closeBtn = document.querySelector('.image-viewer-close');
    
    // 关闭图片查看器
    closeBtn.addEventListener('click', function() {
        imageViewer.style.display = 'none';
    });
    
    // 点击空白区域关闭
    imageViewer.addEventListener('click', function(e) {
        if (e.target === imageViewer) {
            imageViewer.style.display = 'none';
        }
    });
}

// 查看图片
function viewImage(imageSrc) {
    const imageViewer = document.getElementById('imageViewer');
    const viewerImage = document.getElementById('viewerImage');
    
    viewerImage.src = imageSrc;
    imageViewer.style.display = 'flex';
}

// 全局变量用于存储待删除的记录信息
let recordToDelete = {
    recordId: null,
    competitionName: null
};

// 确认删除
function confirmDelete(recordId, competitionName) {
    // 存储待删除的记录信息
    recordToDelete.recordId = recordId;
    recordToDelete.competitionName = competitionName;
    
    // 显示删除确认弹窗
    document.getElementById('deleteModal').style.display = 'block';
    
    // 绑定确认删除事件
    document.getElementById('confirmDeleteBtn').onclick = function() {
        deleteRecord();
    };
}

// 删除记录（支持直接传参和通过全局变量）
async function deleteRecord(recordId = null, competitionName = null) {
    // 如果没有传入参数，则使用全局变量中的值
    const id = recordId !== null ? recordId : recordToDelete.recordId;
    const name = competitionName !== null ? competitionName : recordToDelete.competitionName;
    
    if (id !== null && name !== null) {
        const record = awardData.find(r => r.id === id);
        
        if (record) {
            // 找到要删除的竞赛记录
            const competitionIndex = record.competitions.findIndex(c => c.competition === name);
            
            if (competitionIndex !== -1) {
                // 删除该竞赛记录
                record.competitions.splice(competitionIndex, 1);
                
                try {
                    // 如果该用户没有其他竞赛记录，则删除整个用户记录
                    if (record.competitions.length === 0) {
                        await fetch(`/api/awards/${id}`, { method: 'DELETE' });
                        // 同步本地数据
                        const idx = awardData.findIndex(r => r.id === id);
                        if (idx !== -1) awardData.splice(idx, 1);
                    } else {
                        // 更新服务器上的记录
                        await fetch(`/api/awards/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(record)
                        });
                    }

                    // 关闭弹窗并更新表格
                    document.getElementById('deleteModal').style.display = 'none';
                    filterData();
                    
                    // 更新存储容量显示
                    updateStorageInfo();
                    
                    // 重置待删除记录信息
                    recordToDelete = {
                        recordId: null,
                        competitionName: null
                    };
                } catch (error) {
                    console.error('删除失败:', error);
                    alert('删除失败，请重试');
                }
            }
        }
    }
}

// 初始化日期筛选选择器
function initDateFilters() {
    // 生成年份选项（只包含2023-2027）
    let yearOptions = '<option value="">年</option>';
    for (let year = 2023; year <= 2027; year++) {
        yearOptions += `<option value="${year}">${year}</option>`;
    }
    
    // 生成月份选项
    let monthOptions = '<option value="">月</option>';
    for (let month = 1; month <= 12; month++) {
        monthOptions += `<option value="${month.toString().padStart(2, '0')}">${month}</option>`;
    }
    
    // 设置所有日期选择器（只设置年和月）
    document.getElementById('filterStartYear').innerHTML = yearOptions;
    document.getElementById('filterEndYear').innerHTML = yearOptions;
    document.getElementById('filterStartMonth').innerHTML = monthOptions;
    document.getElementById('filterEndMonth').innerHTML = monthOptions;
    
    // 初始化自动完成功能
    initAutocomplete();
}

// 编辑弹窗日期选择器初始化（只执行一次）
let editDateSelectorsInitialized = false;

function initEditDateSelectors() {
    if (editDateSelectorsInitialized) return;
    
    // 生成年份选项（只包含2023-2027）
    let yearOptions = '<option value="">请选择年</option>';
    for (let year = 2023; year <= 2027; year++) {
        yearOptions += `<option value="${year}">${year}年</option>`;
    }
    
    // 生成月份选项
    let monthOptions = '<option value="">请选择月</option>';
    for (let month = 1; month <= 12; month++) {
        monthOptions += `<option value="${month.toString().padStart(2, '0')}">${month}月</option>`;
    }
    
    // 设置编辑弹窗的日期选择器（只设置年和月）
    document.getElementById('editYear').innerHTML = yearOptions;
    document.getElementById('editMonth').innerHTML = monthOptions;
    
    editDateSelectorsInitialized = true;
}

// 自动完成功能
function initAutocomplete() {
    const nameInput = document.getElementById('filterName');
    const nameDropdown = document.getElementById('nameAutocomplete');
    const competitionInput = document.getElementById('filterCompetition');
    const competitionDropdown = document.getElementById('competitionAutocomplete');
    
    // 获取所有姓名
    function getAllNames() {
        const names = new Set();
        awardData.forEach(record => {
            names.add(record.name);
        });
        return Array.from(names).sort();
    }
    
    // 获取所有竞赛名称
    function getAllCompetitions() {
        const competitions = new Set();
        awardData.forEach(record => {
            record.competitions.forEach(comp => {
                competitions.add(comp.competition);
            });
        });
        return Array.from(competitions).sort();
    }
    
    // 创建自动完成下拉菜单
    function createAutocomplete(input, dropdown, dataSource) {
        let selectedIndex = -1;
        
        input.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const filtered = dataSource().filter(item => 
                item.toLowerCase().includes(query)
            );
            
            if (filtered.length > 0 && query.length > 0) {
                showDropdown(filtered);
            } else {
                hideDropdown();
            }
            selectedIndex = -1;
        });
        
        input.addEventListener('focus', function() {
            if (this.value.length > 0) {
                const query = this.value.toLowerCase();
                const filtered = dataSource().filter(item => 
                    item.toLowerCase().includes(query)
                );
                if (filtered.length > 0) {
                    showDropdown(filtered);
                }
            }
        });
        
        input.addEventListener('blur', function() {
            setTimeout(hideDropdown, 200);
        });
        
        input.addEventListener('keydown', function(e) {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateSelected(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateSelected(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    selectItem(items[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                hideDropdown();
            }
        });
        
        function showDropdown(items) {
            dropdown.innerHTML = items.map(item => 
                `<div class="autocomplete-item">${item}</div>`
            ).join('');
            
            dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                item.addEventListener('click', function() {
                    selectItem(this);
                });
                item.addEventListener('mouseenter', function() {
                    selectedIndex = index;
                    updateSelected(dropdown.querySelectorAll('.autocomplete-item'));
                });
            });
            
            dropdown.classList.add('show');
        }
        
        function hideDropdown() {
            dropdown.classList.remove('show');
        }
        
        function selectItem(item) {
            input.value = item.textContent;
            hideDropdown();
            applyCurrentFilters();
        }
        
        function updateSelected(items) {
            items.forEach((item, index) => {
                item.classList.toggle('active', index === selectedIndex);
            });
        }
    }
    
    // 初始化姓名和竞赛名称的自动完成
    createAutocomplete(nameInput, nameDropdown, getAllNames);
    createAutocomplete(competitionInput, competitionDropdown, getAllCompetitions);
}

// 筛选数据
function filterData() {
    applyCurrentFilters();
}

// 编辑记录
function editRecord(recordId, competitionName) {
    const record = awardData.find(r => r.id === recordId);
    const competition = record.competitions.find(c => c.competition === competitionName);

    if (record && competition) {
        // 初始化编辑弹窗的日期选择器（只初始化一次）
        initEditDateSelectors();
        
        document.getElementById('editRecordId').value = recordId;
        document.getElementById('editCompetitionName').value = competition.competition; // 保存原始竞赛名称用于查找
        document.getElementById('editName').value = record.name;
        document.getElementById('editMajor').value = record.major;
        
        // 处理日期字段（YYYY-MM 格式）
        const dateParts = competition.date ? competition.date.split('-') : ['', ''];
        document.getElementById('editYear').value = dateParts[0] || '';
        document.getElementById('editMonth').value = dateParts[1] || '';
        
        document.getElementById('editCompetition').value = competition.competition;
        document.getElementById('editLevel').value = competition.level;
        document.getElementById('editAward').value = competition.award;
        
        // 显示证书预览
        const preview = document.getElementById('editCertificatePreview');
        preview.innerHTML = '';
        
        if (competition.certificate) {
            const img = document.createElement('img');
            img.src = competition.certificate;
            img.className = 'certificate-img';
            preview.appendChild(img);
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }

        document.getElementById('editModal').style.display = 'block';
    }
}

// 保存编辑
async function saveEdit() {
    const recordId = parseInt(document.getElementById('editRecordId').value);
    const record = awardData.find(r => r.id === recordId);
    const oldCompetitionName = document.getElementById('editCompetitionName').value; // 获取原始竞赛名称

    if (record) {
        record.name = document.getElementById('editName').value;
        record.major = document.getElementById('editMajor').value;

        const competition = record.competitions.find(c => c.competition === oldCompetitionName);
        if (competition) {
            // 获取日期值并组合为 YYYY-MM 格式
            const year = document.getElementById('editYear').value;
            const month = document.getElementById('editMonth').value;
            competition.date = `${year}-${month}`;
            
            competition.competition = document.getElementById('editCompetition').value;
            competition.level = document.getElementById('editLevel').value;
            competition.award = document.getElementById('editAward').value;
            
            // 处理新上传的证书
            const fileInput = document.getElementById('editCertificate');
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    competition.certificate = e.target.result;

                    try {
                        // 更新服务器上的记录
                        await fetch(`/api/awards/${recordId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(record)
                        });

                        // 关闭弹窗并更新表格
                        document.getElementById('editModal').style.display = 'none';

                        // 重新应用当前筛选条件
                        applyCurrentFilters();

                        // 更新存储容量显示
                        updateStorageInfo();
                    } catch (error) {
                        console.error('保存失败:', error);
                        alert('保存失败，请检查网络连接后重试');
                    }
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                try {
                    // 更新服务器上的记录
                    await fetch(`/api/awards/${recordId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(record)
                    });

                    // 关闭弹窗并更新表格
                    document.getElementById('editModal').style.display = 'none';

                    // 重新应用当前筛选条件
                    applyCurrentFilters();

                    // 更新存储容量显示
                    updateStorageInfo();
                } catch (error) {
                    console.error('保存失败:', error);
                    alert('保存失败，请检查网络连接后重试');
                }
            }
        }
    }
}

// 应用当前筛选条件
function applyCurrentFilters() {
    const filterName = document.getElementById('filterName').value.trim().toLowerCase();
    const filterCompetition = document.getElementById('filterCompetition').value.trim().toLowerCase();
    const filterLevel = document.getElementById('filterLevel').value;
    const filterAward = document.getElementById('filterAward').value;
    
    // 获取年月区间筛选条件（只选年和月）
    const startYear = document.getElementById('filterStartYear').value;
    const startMonth = document.getElementById('filterStartMonth').value;
    const endYear = document.getElementById('filterEndYear').value;
    const endMonth = document.getElementById('filterEndMonth').value;
    
    // 组合年月字符串（YYYY-MM 格式）
    const startDate = startYear && startMonth ? `${startYear}-${startMonth}` : null;
    const endDate = endYear && endMonth ? `${endYear}-${endMonth}` : null;

    let totalCount = 0;
    const filteredData = [];
    
    // 遍历所有记录
    awardData.forEach(record => {
        // 筛选包含特定竞赛的记录
        const filteredCompetitions = record.competitions.filter(competition => {
            const nameMatch = !filterName || record.name.toLowerCase().includes(filterName);
            const competitionMatch = !filterCompetition || competition.competition.toLowerCase().includes(filterCompetition);
            const levelMatch = !filterLevel || competition.level === filterLevel;
            const awardMatch = !filterAward || competition.award === filterAward;
            
            // 年月区间匹配（YYYY-MM 格式）
            let dateMatch = true;
            if (competition.date) {
                if (startDate && competition.date < startDate) {
                    dateMatch = false;
                }
                if (endDate && competition.date > endDate) {
                    dateMatch = false;
                }
            }

            const isMatch = nameMatch && competitionMatch && levelMatch && awardMatch && dateMatch;
            if (isMatch) totalCount++;
            return isMatch;
        });

        // 如果该记录有符合条件的竞赛，则保留该记录，并只保留符合条件的竞赛
        if (filteredCompetitions.length > 0) {
            filteredData.push({
                ...record,
                competitions: filteredCompetitions
            });
        }
    });

    // 更新结果计数
    document.getElementById('resultCount').querySelector('span').textContent = totalCount;

    displayAwardData(filteredData);
}

// 更新存储容量显示
async function updateStorageInfo() {
    try {
        const response = await fetch('/api/awards');
        if (response.ok) {
            const data = await response.json();
            let totalRecords = 0;
            data.forEach(r => { totalRecords += r.competitions.length; });

            const usedEl = document.getElementById('usedStorage');
            const totalEl = document.getElementById('totalStorage');
            const remainingEl = document.getElementById('remainingStorage');
            const storageBar = document.getElementById('storageBar');

            if (usedEl) usedEl.textContent = `服务器模式`;
            if (totalEl) totalEl.textContent = `总人数: ${data.length}`;
            if (remainingEl) remainingEl.textContent = `总记录: ${totalRecords}`;
            if (storageBar) storageBar.style.width = '100%';
        }
    } catch (error) {
        console.error('获取服务器状态失败:', error);
        const usedEl = document.getElementById('usedStorage');
        if (usedEl) usedEl.textContent = '服务器未连接';
    }
}

// 格式化字节数为可读格式
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}