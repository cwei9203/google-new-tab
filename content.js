/**
 * Google搜索结果新标签页打开插件
 * 
 * 功能说明：
 * - 自动修改Google搜索页面中的搜索结果链接
 * - 让这些链接在新标签页中打开，而不是当前标签页
 * - 支持动态加载的搜索结果（无限滚动）
 * - 智能过滤，跳过广告和内部链接
 */
(function() {
    'use strict';

    /**
     * 核心函数：修改搜索结果链接的行为
     * 
     * 这个函数会：
     * 1. 查找页面中所有的搜索结果链接
     * 2. 为每个链接添加在新标签页打开的属性
     * 3. 添加安全属性防止安全风险
     * 4. 标记已处理的链接避免重复处理
     */
    function modifySearchResults() {
        // 使用CSS选择器查找不同类型的搜索结果链接
        // 解释各个选择器：
        // - 'a[href*="/url?q="]': 传统的Google搜索结果链接格式
        // - 'a[jsname]': 带有jsname属性的链接（Google内部标识）
        // - '.g h3 a': 位于.g容器内h3标签中的链接（经典搜索结果布局）
        // - '.yuRUbf a': 新版Google搜索结果布局中的链接
        const searchLinks = document.querySelectorAll('a[href*="/url?q="], a[jsname], .g h3 a, .yuRUbf a');
        
        // 遍历找到的每个搜索结果链接
        searchLinks.forEach(link => {
            // 安全检查和过滤条件：
            // 1. link.href 存在（确保是有效链接）
            // 2. 不包含 'google.com/search'（避免处理Google内部搜索链接）
            // 3. 不包含 '#'（跳过页面内锚点链接）
            // 4. 没有被此插件处理过（避免重复处理）
            if (link.href && 
                !link.href.includes('google.com/search') && 
                !link.href.includes('#') &&
                !link.classList.contains('modified-by-extension')) {
                
                // 设置链接在新标签页打开
                link.target = '_blank';
                
                // 添加安全属性，防止新页面访问原页面的window对象
                // 'noopener': 防止新页面通过window.opener访问原页面
                // 'noreferrer': 不发送referrer信息，提高隐私保护
                link.rel = 'noopener noreferrer';
                
                // 添加CSS类标记，表示此链接已被插件处理过
                // 这样可以避免重复处理同一个链接
                link.classList.add('modified-by-extension');
            }
        });

        // 单独处理图片搜索结果
        // Google图片搜索的链接格式不同，需要特别处理
        // 'a[href*="/imgres"]': 包含/imgres的链接是图片搜索结果
        const imageLinks = document.querySelectorAll('a[href*="/imgres"]');
        imageLinks.forEach(link => {
            // 检查是否已被处理过，避免重复设置
            if (!link.classList.contains('modified-by-extension')) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.classList.add('modified-by-extension');
            }
        });
    }

    // 页面加载完成后立即执行一次链接修改
    // 这处理初始加载时就存在的搜索结果
    modifySearchResults();

    /**
     * 设置DOM变化监听器
     * 
     * Google搜索页面使用AJAX技术动态加载内容，包括：
     * - 点击"更多结果"按钮时加载的新内容
     * - 无限滚动时自动加载的内容
     * - 切换搜索标签（图片、视频等）时的内容变化
     * 
     * MutationObserver可以监听这些动态变化
     */
    const observer = new MutationObserver(function(mutations) {
        let shouldModify = false;
        
        // 检查每个DOM变化
        mutations.forEach(function(mutation) {
            // 如果有新的子元素被添加到页面中
            // 这通常意味着Google加载了新的搜索结果
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldModify = true;
            }
        });
        
        // 如果检测到有新内容，延迟100毫秒后处理新链接
        // 延迟是为了确保Google完全渲染完新内容
        if (shouldModify) {
            setTimeout(modifySearchResults, 100);
        }
    });

    // 开始监听整个页面body的DOM变化
    // childList: true - 监听子元素的添加/删除
    // subtree: true - 监听所有后代元素的变化（不仅仅是直接子元素）
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    /**
     * 处理滚动事件
     * 
     * 有些情况下，Google会在用户滚动时延迟加载内容
     * 为了确保这些延迟加载的链接也被处理，我们监听滚动事件
     * 使用防抖技术避免过于频繁的处理
     */
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        // 清除之前的定时器（防抖）
        clearTimeout(scrollTimeout);
        
        // 滚动停止200毫秒后检查并处理新链接
        scrollTimeout = setTimeout(modifySearchResults, 200);
    });

    // 在控制台输出确认信息，便于调试
    // 可以在浏览器的开发者工具控制台中看到此信息
    console.log('Google搜索新标签页打开插件已激活');

    /**
     * 使用立即执行函数表达式(IIFE)包装整个插件代码
     * 好处：
     * 1. 避免污染全局命名空间
     * 2. 防止与页面其他脚本产生变量冲突
     * 3. 创建私有作用域，保护插件内部变量
     */
})(); 