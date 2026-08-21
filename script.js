// ============================================
// WRJ JOIAS - SCRIPT COMPLETO
// ============================================

// ============================================
// CONFIGURAÇÕES
// ============================================
const PLANILHA_ID = "1AL1_DDF9dOO-qS_fnEBoz94687lYp7rqIVLFnUT7ch8";

// URLS CORRETAS para exportar como CSV
const PRODUCTS_CSV_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQSSuhY_r_jTgQqR_v_BTbk9AlhRxrRKFsUgE-jGkqYeDyww387Lgwvs9GG7Q5vJP1UPhbvn9nhMcgc/pub?gid=1810786293&single=true&output=csv`;
const BANNERS_CSV_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQSSuhY_r_jTgQqR_v_BTbk9AlhRxrRKFsUgE-jGkqYeDyww387Lgwvs9GG7Q5vJP1UPhbvn9nhMcgc/pub?gid=1271686459&single=true&output=csv`;

const ESTOQUE_API_URL = "https://script.google.com/macros/s/AKfycbx-vvLsDmvtIQHeH10z5xJXgReG-RRzzhLQYmWAJcoZ1ZW7Cr2M_PcZn1E61araSFlu6A/exec";

let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedColor = "";
let tempProduct = null;
let destaquesSwiper = null;
let heroSwiper = null;
let categoriesSwiper = null;
let subtotal = 0;
const FRETE_GRATIS_VALOR = 3500;
const TAXA_FRETE = 15;

// ============================================
// VARIÁVEIS PARA GALERIA DE IMAGENS
// ============================================
let imagensZoom = [];
let zoomIndex = 0;

// ============================================
// FUNÇÃO PARA PARSEAR CSV CORRETAMENTE
// ============================================
function parseCSV(text) {
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentLine.push(currentField.trim());
            currentField = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentLine.push(currentField.trim());
            if (currentLine.some(field => field !== '')) {
                lines.push(currentLine);
            }
            currentLine = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    
    if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some(field => field !== '')) {
            lines.push(currentLine);
        }
    }
    
    return lines;
}

function normalizar(texto) {
    if (!texto) return "";
    return texto
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function driveImg(url) {
    if (!url) return "https://via.placeholder.com/400?text=Sem+Imagem";
    
    // Se já for uma URL do Googleusercontent, retorna ela
    if (url.includes('googleusercontent.com')) return url;
    
    // Tenta extrair o ID do Google Drive
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
        return `https://lh3.googleusercontent.com/u/0/d/${match[1]}=w800`;
    }
    
    // Se for uma URL válida, retorna ela
    if (url.startsWith('http')) return url;
    
    // Fallback
    return "https://via.placeholder.com/400?text=Sem+Imagem";
}
// ============================================
// FUNÇÃO UPDATE CART
// ============================================
function updateCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
        cartCount.innerText = cart.length;
    }
    
    const container = document.getElementById("cart-items");
    if (!container) return;
    container.innerHTML = "";
    subtotal = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-textMuted">
                <i class="fas fa-shopping-bag text-4xl text-primary/20 mb-3"></i>
                <p class="text-sm">Sua sacola está vazia</p>
                <p class="text-xs text-textMuted/60 mt-1">Adicione produtos para começar</p>
            </div>
        `;
    } else {
        cart.forEach((item) => {
            subtotal += item.price;
            const div = document.createElement("div");
            div.className = "flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-2xl mb-2 border border-primary/10";
            div.innerHTML = `
                <img src="${driveImg(item.img)}" class="w-14 h-14 rounded-xl object-cover flex-shrink-0">
                <div class="flex-1 w-full">
                    <h4 class="text-[11px] font-bold text-slate-800">${item.name}</h4>
                    ${item.ref ? `<p class="ref-text text-[10px] mt-1">Ref: ${item.ref}</p>` : ""}
                    <div class="flex justify-between items-center mt-2">
                        <p class="font-black text-primary text-sm">R$ ${item.price.toFixed(2).replace(".", ",")}</p>
                        <div class="flex gap-2 bg-primary/5 px-2 py-1 rounded-lg">
                            <button onclick="changeQty('${item.id}', -1)" class="text-xs font-bold text-primary w-6 h-6 rounded-full hover:bg-primary/10">-</button>
                            <span class="text-xs font-bold w-6 text-center">${item.quantity}</span>
                            <button onclick="changeQty('${item.id}', 1)" class="text-xs font-bold text-primary w-6 h-6 rounded-full hover:bg-primary/10">+</button>
                        </div>
                    </div>
                </div>
                <button onclick="removeCartItem('${item.id}')" class="text-slate-400 hover:text-red-500 transition-colors text-xs flex items-center gap-1 mt-2 sm:mt-0"><i class="fas fa-trash-alt"></i> Remover</button>
            `;
            container.appendChild(div);
        });
    }

    const bar = document.getElementById("free-shipping-bar");
    const text = document.getElementById("free-shipping-text");
    const subtotalEl = document.getElementById("cart-subtotal");
    const shippingEl = document.getElementById("cart-shipping");
    const totalEl = document.getElementById("cart-total");
    const clearBtn = document.getElementById("clear-cart-btn");

    if (subtotalEl) subtotalEl.innerText = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;

    if (subtotal >= FRETE_GRATIS_VALOR) {
        if (bar) bar.style.width = "100%";
        if (text) text.innerHTML = "🎉 Frete GRÁTIS!";
        if (shippingEl) shippingEl.innerText = "GRÁTIS";
        if (totalEl) totalEl.innerText = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
    } else {
        const percent = (subtotal / FRETE_GRATIS_VALOR) * 100;
        const falta = FRETE_GRATIS_VALOR - subtotal;
        if (bar) bar.style.width = `${Math.min(percent, 100)}%`;
        if (text) text.innerHTML = `Faltam R$ ${falta.toFixed(2).replace(".", ",")} para frete grátis`;
        if (shippingEl) shippingEl.innerText = `R$ ${TAXA_FRETE.toFixed(2).replace(".", ",")}`;
        if (totalEl) totalEl.innerText = `R$ ${(subtotal + TAXA_FRETE).toFixed(2).replace(".", ",")}`;
    }

    if (clearBtn) {
        if (cart.length === 0) {
            clearBtn.classList.add("hidden");
        } else {
            clearBtn.classList.remove("hidden");
        }
    }
    if (cart.length === 0) {
        document.getElementById("cart-modal").classList.add("hidden");
        document.getElementById("cart-modal").classList.remove("flex");
    }
}

// ============================================
// FUNÇÕES DO CARRINHO
// ============================================
window.removeCartItem = function (id) {
    cart = cart.filter((i) => i.id !== id);
    updateCart();
    Toastify({
        text: "Item removido da sacola",
        duration: 2000,
        style: { background: "#ef4444" },
    }).showToast();
};

window.changeQty = function (id, delta) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const precoUnitario = item.price / item.quantity;

    if (delta > 0) {
        item.quantity++;
        item.price = precoUnitario * item.quantity;
    } else {
        if (item.quantity > 1) {
            item.quantity--;
            item.price = precoUnitario * item.quantity;
        } else {
            cart = cart.filter((i) => i.id !== id);
        }
    }
    updateCart();
};

function addToCart(id, name, price, img, baseId, ref, quantity) {
    const qty = quantity || 1;
    const precoUnitario = price / qty;

    const existing = cart.find((i) => i.id === id);
    if (existing) {
        existing.quantity += qty;
        existing.price = precoUnitario * existing.quantity;
    } else {
        cart.push({
            id,
            name,
            price: price,
            img,
            quantity: qty,
            baseId: baseId,
            ref: ref,
        });
    }
    Toastify({
        text: `${name.substring(0, 30)} adicionado!`,
        duration: 2000,
        style: { background: "#2f6b4f" },
    }).showToast();
    updateCart();
}

// ============================================
// FUNÇÃO LOAD PRODUCTS
// ============================================
async function loadProducts() {
    try {
        console.log("🔄 Carregando produtos...");

        const response = await fetch(PRODUCTS_CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();

        const rows = parseCSV(data);

        if (rows.length < 2) {
            throw new Error("Planilha vazia ou formato incorreto");
        }

        const headers = rows[0].map(h => h.replace(/"/g, '').trim());

        const colIndex = {
            ID: headers.indexOf("ID"),
            Nome: headers.indexOf("Nome do Produto"),
            Referencia: headers.indexOf("referencia"),
            Preco: headers.indexOf("Preço"),
            Quantidade: headers.indexOf("Quantidade"),
            Categoria: headers.indexOf("Categoria"),
            Cores: headers.indexOf("Cores"),
            Tamanho: headers.indexOf("Tamanho"),
            Imagem: headers.indexOf("Imagem"),
            Disponivel: headers.indexOf("Disponível"),
            Destaque: headers.indexOf("Destaque"),
            EstoqueInicial: headers.indexOf("Estoque Inicial"),
            Vendidos: headers.indexOf("Vendidos"),
            SaldoEstoque: headers.indexOf("Saldo Estoque")
        };

        allProducts = rows.slice(1)
            .map((row, index) => {
                while (row.length < headers.length) {
                    row.push('');
                }

                const produto = {
                    ID: row[colIndex.ID] || '',
                    "Nome do Produto": row[colIndex.Nome] || '',
                    referencia: row[colIndex.Referencia] || '',
                    Preço: parseFloat(row[colIndex.Preco]?.replace(/[R$.,]/g, m => m === ',' ? '.' : '')) || 0,
                    Quantidade: row[colIndex.Quantidade] || '',
                    Categoria: row[colIndex.Categoria] || '',
                    Cores: row[colIndex.Cores] || '',
                    Tamanho: row[colIndex.Tamanho] || '',
                    Imagem: row[colIndex.Imagem] || 'placeholder.png',
                    Disponível: row[colIndex.Disponivel] || 'sim',
                    Destaque: row[colIndex.Destaque] || 'nao',
                    "Saldo Estoque": parseInt(row[colIndex.SaldoEstoque]) || 0
                };

                if (!row[colIndex.SaldoEstoque] || parseInt(row[colIndex.SaldoEstoque]) === 0) {
                    const inicial = parseInt(row[colIndex.EstoqueInicial]) || 0;
                    const vendidos = parseInt(row[colIndex.Vendidos]) || 0;
                    produto["Saldo Estoque"] = inicial - vendidos;
                }

                return produto;
            })
            .filter(p => p["Nome do Produto"] && p["Nome do Produto"].trim() !== '');

        console.log(`✅ ${allProducts.length} produtos carregados com sucesso!`);

        if (allProducts.length === 0) {
            const container = document.getElementById("produtos-container");
            if (container) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-gem text-4xl text-primary/30 mb-4"></i>
                        <p class="text-textMuted">Nenhum produto disponível no momento.</p>
                        <p class="text-xs text-textMuted/60 mt-2">Verifique se a planilha está populada e publicada.</p>
                        <button onclick="loadProducts()" class="mt-4 bg-primary text-white px-6 py-2 rounded-full text-sm font-bold">
                            <i class="fas fa-sync-alt mr-2"></i>Recarregar
                        </button>
                    </div>
                `;
            }
            return;
        }

        renderProducts(allProducts);
        renderDestaques(allProducts);

    } catch (err) {
        console.error("❌ Erro ao carregar produtos:", err);
        const container = document.getElementById("produtos-container");
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-textMuted font-bold">Erro ao carregar produtos</p>
                    <p class="text-xs text-textMuted/60 mt-2">${err.message}</p>
                    <button onclick="loadProducts()" class="mt-4 bg-primary text-white px-6 py-2 rounded-full text-sm font-bold">
                        <i class="fas fa-sync-alt mr-2"></i>Tentar novamente
                    </button>
                </div>
            `;
        }
    }
}


// ============================================
// FUNÇÃO RENDER PRODUCTS (COM ESTOQUE DESTACADO)
// ============================================
function renderProducts(products) {
    const container = document.getElementById("produtos-container");
    if (!container) return;
    container.innerHTML = "";
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search text-4xl text-primary/30 mb-4"></i>
                <p class="text-textMuted">Nenhum produto encontrado para esta categoria</p>
            </div>
        `;
        return;
    }
    
    products.forEach((p) => {
        const estoque = parseInt(p["Saldo Estoque"]) || 0;
        
        // 🔥 BADGE DE ESTOQUE DESTACADO
        let stockBadge = '';
        if (estoque <= 0) {
            stockBadge = `<span class="stock-out"><i class="fas fa-times-circle"></i> Indisponível</span>`;
        } else if (estoque <= 3) {
            stockBadge = `<span class="stock-low"><i class="fas fa-exclamation-triangle"></i> Últimas ${estoque} unidades!</span>`;
        } else {
            stockBadge = `<span class="stock-available"><i class="fas fa-check-circle"></i> ${estoque} unidades disponíveis</span>`;
        }
        
        const card = document.createElement("div");
        card.className = "bg-white rounded-3xl overflow-hidden border border-primary/10 shadow-card hover:shadow-lg transition-all duration-300";
        card.innerHTML = `
            <div class="relative aspect-square bg-bgSoft group">
                <img src="${driveImg(p["Imagem"])}" 
                     class="w-full h-full object-cover cursor-zoom-in" 
                     alt="${p["Nome do Produto"]}" 
                     onerror="this.src='https://via.placeholder.com/400?text=Sem+Imagem'"
                     onclick="abrirZoomDireto('${p["Imagem"]}')">
                ${estoque <= 0 ? '<div class="absolute inset-0 bg-black/50 flex items-center justify-center"><span class="text-white font-bold text-lg">ESGOTADO</span></div>' : ''}
            </div>
            <div class="p-4">
                <h3 class="font-bold text-sm">${p["Nome do Produto"]}</h3>
                ${p["referencia"] ? `<p class="ref-text text-xs">Ref: ${p["referencia"]}</p>` : ""}
                <p class="text-lg font-black text-primary mt-2">R$ ${p["Preço"].toFixed(2).replace(".", ",")}</p>
                <!-- 🔥 ESTOQUE DESTACADO -->
                <div class="product-stock">${stockBadge}</div>
                ${estoque > 0 ? `<button onclick='openSizeSelector("${p["ID"]}", "${p["Nome do Produto"].replace(/'/g, "\\'")}", "${p["referencia"] || ""}", ${p["Preço"]}, "${p["Imagem"]}")' class="w-full mt-2 py-2 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primaryDark transition">Escolher Opções</button>` : `<button disabled class="w-full mt-2 py-2 rounded-xl font-bold text-xs bg-gray-300 text-gray-500 cursor-not-allowed">Indisponível</button>`}
            </div>
        `;
        container.appendChild(card);
    });
}


// ============================================
// FUNÇÃO RENDER DESTAQUES (COM ESTOQUE DESTACADO)
// ============================================
function renderDestaques(products) {
    const destaques = products
        .filter(p => p["Destaque"] === "sim" && parseInt(p["Saldo Estoque"]) > 0)
        .slice(0, 12);
    const container = document.getElementById("destaques-container");
    if (!container) return;
    container.innerHTML = "";
    
    if (destaques.length === 0) {
        container.innerHTML = `<div class="swiper-slide text-center py-8 text-textMuted">Nenhum produto em destaque</div>`;
        return;
    }
    
    destaques.forEach((p) => {
        const estoque = parseInt(p["Saldo Estoque"]) || 0;
        
        // 🔥 BADGE DE ESTOQUE DESTACADO
        let stockBadge = '';
        if (estoque <= 3) {
            stockBadge = `<span class="stock-low"><i class="fas fa-exclamation-triangle"></i> Últimas ${estoque}!</span>`;
        } else {
            stockBadge = `<span class="stock-available"><i class="fas fa-check-circle"></i> ${estoque} disponíveis</span>`;
        }
        
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = `
            <div class="bg-white rounded-3xl overflow-hidden border border-primary/10 shadow-soft h-full flex flex-col">
                <div class="relative h-48 bg-bgSoft group">
                    <img src="${driveImg(p["Imagem"])}" 
                         class="max-h-full max-w-full object-contain cursor-zoom-in mx-auto" 
                         alt="${p["Nome do Produto"]}" 
                         onerror="this.src='https://via.placeholder.com/400?text=Sem+Imagem'"
                         onclick="abrirZoomDireto('${p["Imagem"]}')">
                    <span class="absolute top-2 left-2 bg-primary text-white text-[10px] px-2 py-1 rounded">⭐ Destaque</span>
                </div>
                <div class="p-4 flex-1">
                    <h3 class="font-bold text-sm">${p["Nome do Produto"]}</h3>
                    ${p["referencia"] ? `<p class="ref-text text-xs">Ref: ${p["referencia"]}</p>` : ""}
                    <p class="text-lg font-black text-primary">R$ ${p["Preço"].toFixed(2).replace(".", ",")}</p>
                    <!-- 🔥 ESTOQUE DESTACADO -->
                    <div class="product-stock">${stockBadge}</div>
                    <button onclick='openSizeSelector("${p["ID"]}", "${p["Nome do Produto"].replace(/'/g, "\\'")}", "${p["referencia"] || ""}", ${p["Preço"]}, "${p["Imagem"]}")' class="w-full mt-2 py-2 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primaryDark transition">Comprar</button>
                </div>
            </div>
        `;
        container.appendChild(slide);
    });
    
    if (destaquesSwiper) destaquesSwiper.destroy();
    destaquesSwiper = new Swiper(".destaquesSwiper", {
        slidesPerView: 2,
        spaceBetween: 16,
        breakpoints: {
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
        },
        navigation: { nextEl: ".destaque-next", prevEl: ".destaque-prev" },
    });
}

// ============================================
// ZOOM DIRETO (FORA DO MODAL DE CORES) - CORRIGIDO
// ============================================
function abrirZoomDireto(imagem) {
    console.log("🔍 Abrindo zoom para imagem:", imagem);
    
    const modal = document.getElementById("image-zoom-modal");
    const img = document.getElementById("zoom-image");
    const thumbnails = document.getElementById("zoom-thumbnails");
    
    if (!modal || !img || !thumbnails) {
        console.error("❌ Modal de zoom não encontrado");
        return;
    }
    
    // 🔥 CONVERTER URL PARA EXIBIÇÃO
    const imagemExibir = driveImg(imagem);
    console.log("📸 Imagem para exibir:", imagemExibir);
    
    // 🔥 COLETAR TODAS AS IMAGENS DA PÁGINA
    imagensZoom = [];
    
    // Buscar imagens dos cards de produtos
    document.querySelectorAll('#produtos-container img, #destaques-container img, .product-gallery .main-image').forEach(el => {
        const src = el.getAttribute('src');
        if (src && src !== 'https://via.placeholder.com/400?text=Sem+Imagem' && src !== '') {
            // Evitar duplicatas
            if (!imagensZoom.includes(src)) {
                imagensZoom.push(src);
            }
        }
    });
    
    // 🔥 SE NÃO ENCONTROU IMAGENS, USAR A IMAGEM CLICADA
    if (imagensZoom.length === 0) {
        imagensZoom = [imagemExibir];
    }
    
    // 🔥 ENCONTRAR O ÍNDICE DA IMAGEM CLICADA
    zoomIndex = imagensZoom.indexOf(imagemExibir);
    if (zoomIndex === -1) {
        // Se não encontrou, adicionar no início
        imagensZoom.unshift(imagemExibir);
        zoomIndex = 0;
    }
    
    console.log("📸 Imagens disponíveis:", imagensZoom);
    
    // 🔥 EXIBIR IMAGEM
    img.src = imagensZoom[zoomIndex];
    img.onerror = function() {
        this.src = 'https://via.placeholder.com/800x800?text=Imagem+Indispon%C3%ADvel';
    };
    
    // 🔥 THUMBNAILS
    thumbnails.innerHTML = '';
    imagensZoom.forEach((src, i) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.className = `thumbnail-image ${i === zoomIndex ? 'active' : ''}`;
        thumb.style.width = '50px';
        thumb.style.height = '50px';
        thumb.style.objectFit = 'cover';
        thumb.style.borderRadius = '8px';
        thumb.style.cursor = 'pointer';
        thumb.style.border = i === zoomIndex ? '3px solid #2f6b4f' : '2px solid transparent';
        thumb.onerror = function() {
            this.src = 'https://via.placeholder.com/50x50?text=?';
        };
        thumb.onclick = function() {
            zoomIndex = i;
            document.getElementById('zoom-image').src = imagensZoom[i];
            document.querySelectorAll('#zoom-thumbnails .thumbnail-image').forEach((t, idx) => {
                t.style.border = idx === i ? '3px solid #2f6b4f' : '2px solid transparent';
                t.classList.toggle('active', idx === i);
            });
        };
        thumbnails.appendChild(thumb);
    });
    
    // 🔥 MOSTRAR MODAL
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ============================================
// FUNÇÃO INIT CATEGORIES SWIPER
// ============================================
function initCategoriesSwiper() {
    const categoriesData = [
        { name: "✨ INÍCIO", categoria: "todos", type: "simple" },
        { name: "💍 ANÉIS", categoria: "aneis", type: "simple" },
        {
            name: "💎 BRINCOS",
            categoria: "brincos",
            type: "dropdown",
            subitems: ["Todos os Brincos", "Brincos de Moda", "Brincos Pressão", "Argolas"],
        },
        {
            name: "⛓️ CORRENTES",
            categoria: "correntes",
            type: "dropdown",
            subitems: ["Todas as Correntes", "Correntes Feminina", "Correntes Masculina"],
        },
        {
            name: "⌚ PULSEIRAS",
            categoria: "pulseiras",
            type: "dropdown",
            subitems: ["Todas as Pulseiras", "Pulseiras Feminina", "Pulseiras Masculina", "Pulseiras Infantis"],
        },
        { name: "📿 COLARES", categoria: "colares", type: "simple" },
        { name: "✨ GARGANTILHAS", categoria: "gargantilhas", type: "simple" },
        { name: "⭐ PINGENTES", categoria: "pingentes", type: "simple" },
        { name: "💫 BRACELETES", categoria: "braceletes", type: "simple" },
        {
            name: "🙏 RELIGIOSOS",
            categoria: "religiosos",
            type: "dropdown",
            subitems: ["Terço", "Escapulários"],
        },
        {
            name: "📖 SOBRE",
            categoria: "sobre",
            type: "link",
            link: "#sobre-empresa",
        },
    ];
    
    const wrapper = document.getElementById("categories-swiper-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = "";
    
    categoriesData.forEach((cat) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        
        if (cat.type === "simple") {
            const btn = document.createElement("button");
            btn.className = "category-slide-btn text-[11px] font-black uppercase tracking-widest hover:text-primary transition px-4 py-2";
            btn.innerText = cat.name;
            btn.onclick = () => {
                const filtrados = cat.categoria === "todos" ? allProducts : allProducts.filter((p) => normalizar(p["Categoria"]).includes(cat.categoria));
                renderProducts(filtrados);
                document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
            };
            slide.appendChild(btn);
        } else if (cat.type === "dropdown") {
            const div = document.createElement("div");
            div.className = "dropdown";
            const trigger = document.createElement("button");
            trigger.className = "category-slide-btn text-[11px] font-black uppercase tracking-widest hover:text-primary transition flex items-center gap-1 px-4 py-2";
            trigger.innerHTML = `${cat.name} <i class="fa-solid fa-chevron-down text-[8px]"></i>`;
            const menu = document.createElement("div");
            menu.className = "dropdown-menu";
            cat.subitems.forEach((sub) => {
                const a = document.createElement("a");
                a.innerText = sub;
                a.onclick = (e) => {
                    e.preventDefault();
                    const filtrados = allProducts.filter((p) => normalizar(p["Categoria"]).includes(normalizar(sub)));
                    renderProducts(filtrados);
                    document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
                };
                menu.appendChild(a);
            });
            div.appendChild(trigger);
            div.appendChild(menu);
            slide.appendChild(div);
        } else if (cat.type === "link") {
            const a = document.createElement("a");
            a.href = cat.link;
            a.className = "category-slide-btn text-[11px] font-black uppercase tracking-widest hover:text-primary transition px-4 py-2 no-underline text-textDark";
            a.innerText = cat.name;
            slide.appendChild(a);
        }
        wrapper.appendChild(slide);
    });
    
    if (categoriesSwiper) categoriesSwiper.destroy();
    categoriesSwiper = new Swiper(".categoriesSwiper", {
        slidesPerView: "auto",
        spaceBetween: 8,
        freeMode: true,
        navigation: {
            nextEl: ".categoriesSwiper .swiper-button-next",
            prevEl: ".categoriesSwiper .swiper-button-prev",
        },
    });
}

// ============================================
// FUNÇÕES DO MODAL DE CORES E QUANTIDADE
// ============================================
window.openSizeSelector = function (id, name, ref, price, img) {
    console.log("Abrindo seletor para:", id, name);

    const p = allProducts.find(prod => prod["ID"].toString() === id.toString());
    if (!p) {
        Toastify({
            text: "Produto não encontrado!",
            duration: 2000,
            style: { background: "#ef4444" },
        }).showToast();
        return;
    }

    tempProduct = { id: p["ID"], name: name, price: price, img: img, ref: ref };
    selectedColor = "";
    
    const estoque = parseInt(p["Saldo Estoque"]) || 0;

    document.getElementById("size-product-name").innerText = name;
    document.getElementById("size-product-ref").innerText = ref ? `Ref: ${ref}` : "";
    document.getElementById("size-product-price").innerHTML = `
        R$ ${price.toFixed(2).replace(".", ",")} cada
        <span class="text-xs text-textMuted font-normal block">${estoque} unidades disponíveis</span>
    `;

    const colorContainer = document.getElementById("colors-container");
    colorContainer.innerHTML = "";

    const coresDisponiveis = p["Cores"] ? p["Cores"].split(",").map(c => c.trim()).filter(c => c) : [];

    if (coresDisponiveis.length > 0) {
        coresDisponiveis.forEach((nomeCor) => {
            const btn = document.createElement("button");
            btn.className = "color-name-btn";
            btn.innerText = nomeCor.toUpperCase();
            btn.setAttribute("data-cor", nomeCor.toLowerCase());
            btn.onclick = function() { selectColor(nomeCor); };
            colorContainer.appendChild(btn);
        });
        document.getElementById("color-step").classList.remove("hidden");
        document.getElementById("modal-step-title").innerText = "Selecione a Cor";
    } else {
        selectedColor = "Todas as cores";
        document.getElementById("color-step").classList.add("hidden");
        document.getElementById("size-step").classList.remove("hidden");
        document.getElementById("modal-step-title").innerText = "Selecione a Quantidade";
    }

    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    let quantidades = [];
    if (p["Quantidade"] && p["Quantidade"].trim()) {
        quantidades = p["Quantidade"].split(",").map((q) => parseInt(q.trim())).filter((q) => !isNaN(q) && q > 0);
    }
    if (quantidades.length === 0) {
        quantidades = [1, 2, 3, 5, 10];
    }

    quantidades = quantidades.filter(q => q <= estoque);

    if (quantidades.length === 0) {
        quantidades = [1];
    }

    quantidades.forEach((qtd) => {
        const btn = document.createElement("button");
        btn.className = "qty-option-btn";
        btn.innerText = qtd;
        btn.onclick = function() { finishSelection(qtd); };
        optionsContainer.appendChild(btn);
    });

    // GALERIA DE IMAGENS no modal
    const existingGallery = document.querySelector('.product-gallery-container');
    if (existingGallery) existingGallery.remove();

    const galleryContainer = document.createElement("div");
    galleryContainer.className = "product-gallery-container mt-4";
    galleryContainer.innerHTML = `
        <p class="text-[10px] text-textMuted font-bold uppercase tracking-widest mb-2">Imagens do produto:</p>
        <div class="product-gallery">
            <img src="${driveImg(p["Imagem"])}" class="main-image w-full h-48 object-cover rounded-xl cursor-pointer" onclick="abrirZoomModal('${p["Imagem"]}')" alt="${name}">
            <div class="thumbnails-container">
                <img src="${driveImg(p["Imagem"])}" class="thumbnail-image active" onclick="trocarImagem(this, '${p["Imagem"]}')">
                <img src="${driveImg(p["Imagem"])}" class="thumbnail-image" onclick="trocarImagem(this, '${p["Imagem"]}')">
                <img src="${driveImg(p["Imagem"])}" class="thumbnail-image" onclick="trocarImagem(this, '${p["Imagem"]}')">
            </div>
        </div>
    `;
    
    const modalBody = document.querySelector("#size-modal .bg-white");
    const colorStep = document.getElementById("color-step");
    modalBody.insertBefore(galleryContainer, colorStep);

    document.getElementById("size-modal").classList.remove("hidden");
    document.getElementById("size-modal").classList.add("flex");
};

function selectColor(cor) {
    selectedColor = cor;

    document.querySelectorAll('.color-name-btn').forEach(el => {
        el.classList.remove('selected');
    });
    document.querySelectorAll('.color-name-btn').forEach(btn => {
        if (btn.innerText.toLowerCase() === cor.toLowerCase()) {
            btn.classList.add('selected');
        }
    });

    document.getElementById("color-step").classList.add("hidden");
    document.getElementById("size-step").classList.remove("hidden");
    document.getElementById("modal-step-title").innerText = "Selecione a Quantidade";
}

function finishSelection(quantidade) {
    if (!tempProduct) {
        Toastify({
            text: "Erro: produto não selecionado",
            duration: 2000,
            style: { background: "#ef4444" },
        }).showToast();
        return;
    }
    if (!selectedColor || selectedColor === "") {
        Toastify({
            text: "Por favor, selecione uma cor!",
            duration: 2000,
            style: { background: "#ef4444" },
        }).showToast();
        return;
    }

    const corFinal = selectedColor || "Todas as cores";
    const uniqueId = `${tempProduct.id}-${corFinal}-${quantidade}-${Date.now()}`;
    const fullName = `${tempProduct.name} - ${corFinal}`;
    const totalPrice = tempProduct.price * quantidade;

    addToCart(uniqueId, fullName, totalPrice, tempProduct.img, tempProduct.id, tempProduct.ref, quantidade);
    closeSizeModal();
}

window.closeSizeModal = function () {
    document.getElementById("size-modal").classList.add("hidden");
    document.getElementById("size-modal").classList.remove("flex");
    selectedColor = "";
    tempProduct = null;
    document.querySelectorAll('.color-name-btn').forEach(el => {
        el.classList.remove('selected');
    });
    document.getElementById("color-step").classList.remove("hidden");
    document.getElementById("size-step").classList.add("hidden");
    document.getElementById("modal-step-title").innerText = "Selecione a Cor";
    
    const gallery = document.querySelector('.product-gallery-container');
    if (gallery) gallery.remove();
};

// ============================================
// FUNÇÕES DE GALERIA E ZOOM
// ============================================
function abrirZoom(imagem) {
    const modal = document.getElementById("image-zoom-modal");
    const img = document.getElementById("zoom-image");
    const thumbnails = document.getElementById("zoom-thumbnails");
    
    const allImgs = document.querySelectorAll('.thumbnail-image');
    imagensZoom = [];
    allImgs.forEach(el => {
        const src = el.getAttribute('src');
        if (src) imagensZoom.push(src);
    });
    if (imagensZoom.length === 0) imagensZoom = [imagem];
    
    zoomIndex = imagensZoom.indexOf(imagem);
    if (zoomIndex === -1) zoomIndex = 0;
    
    img.src = imagensZoom[zoomIndex];
    
    thumbnails.innerHTML = '';
    imagensZoom.forEach((src, i) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.className = `thumbnail-image ${i === zoomIndex ? 'active' : ''}`;
        thumb.style.width = '50px';
        thumb.style.height = '50px';
        thumb.onclick = () => {
            zoomIndex = i;
            document.getElementById('zoom-image').src = imagensZoom[i];
            document.querySelectorAll('#zoom-thumbnails .thumbnail-image').forEach((t, idx) => {
                t.classList.toggle('active', idx === i);
            });
        };
        thumbnails.appendChild(thumb);
    });
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharZoom() {
    document.getElementById('image-zoom-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function zoomAnterior() {
    if (imagensZoom.length === 0) return;
    zoomIndex = (zoomIndex - 1 + imagensZoom.length) % imagensZoom.length;
    document.getElementById('zoom-image').src = imagensZoom[zoomIndex];
    document.querySelectorAll('#zoom-thumbnails .thumbnail-image').forEach((t, i) => {
        t.classList.toggle('active', i === zoomIndex);
    });
}

function zoomProximo() {
    if (imagensZoom.length === 0) return;
    zoomIndex = (zoomIndex + 1) % imagensZoom.length;
    document.getElementById('zoom-image').src = imagensZoom[zoomIndex];
    document.querySelectorAll('#zoom-thumbnails .thumbnail-image').forEach((t, i) => {
        t.classList.toggle('active', i === zoomIndex);
    });
}

function trocarImagem(el, src) {
    document.querySelector('.main-image').src = src;
    document.querySelectorAll('.thumbnail-image').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

// ============================================
// ZOOM NO MODAL DE CORES
// ============================================
// ============================================
// ZOOM NO MODAL DE CORES - CORRIGIDO
// ============================================
function abrirZoomModal(imagem) {
    console.log("🔍 Abrindo zoom do modal para imagem:", imagem);
    
    // Pega todas as imagens do modal atual
    const thumbs = document.querySelectorAll('.product-gallery-container .thumbnail-image');
    imagensZoom = [];
    thumbs.forEach(el => {
        const src = el.getAttribute('src');
        if (src && src !== 'https://via.placeholder.com/400?text=Sem+Imagem') {
            if (!imagensZoom.includes(src)) {
                imagensZoom.push(src);
            }
        }
    });
    
    // Se não encontrou thumbnails, pegar a imagem principal
    if (imagensZoom.length === 0) {
        const mainImg = document.querySelector('.main-image');
        if (mainImg) {
            const src = mainImg.getAttribute('src');
            if (src) imagensZoom.push(src);
        }
    }
    
    // Se ainda não tem imagens, usar a imagem clicada
    if (imagensZoom.length === 0) {
        imagensZoom = [driveImg(imagem)];
    }
    
    // Encontrar índice da imagem
    const imagemExibir = driveImg(imagem);
    zoomIndex = imagensZoom.indexOf(imagemExibir);
    if (zoomIndex === -1) {
        zoomIndex = 0;
    }
    
    const modal = document.getElementById("image-zoom-modal");
    const img = document.getElementById("zoom-image");
    const thumbnails = document.getElementById("zoom-thumbnails");
    
    if (!modal || !img || !thumbnails) {
        console.error("❌ Modal de zoom não encontrado");
        return;
    }
    
    img.src = imagensZoom[zoomIndex];
    img.onerror = function() {
        this.src = 'https://via.placeholder.com/800x800?text=Imagem+Indispon%C3%ADvel';
    };
    
    thumbnails.innerHTML = '';
    imagensZoom.forEach((src, i) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.className = `thumbnail-image ${i === zoomIndex ? 'active' : ''}`;
        thumb.style.width = '50px';
        thumb.style.height = '50px';
        thumb.style.objectFit = 'cover';
        thumb.style.borderRadius = '8px';
        thumb.style.cursor = 'pointer';
        thumb.style.border = i === zoomIndex ? '3px solid #2f6b4f' : '2px solid transparent';
        thumb.onerror = function() {
            this.src = 'https://via.placeholder.com/50x50?text=?';
        };
        thumb.onclick = function() {
            zoomIndex = i;
            document.getElementById('zoom-image').src = imagensZoom[i];
            document.querySelectorAll('#zoom-thumbnails .thumbnail-image').forEach((t, idx) => {
                t.style.border = idx === i ? '3px solid #2f6b4f' : '2px solid transparent';
                t.classList.toggle('active', idx === i);
            });
        };
        thumbnails.appendChild(thumb);
    });
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
// ============================================
// FUNÇÃO BAIXAR ESTOQUE (VIA API)
// ============================================
async function baixarEstoque() {
    const itemsParaBaixar = {};

    cart.forEach((item) => {
        const baseId = item.baseId || item.id.toString().split("-")[0];
        const idNumerico = parseInt(baseId);
        if (isNaN(idNumerico)) return;
        if (!itemsParaBaixar[idNumerico]) itemsParaBaixar[idNumerico] = 0;
        itemsParaBaixar[idNumerico] += item.quantity;
    });

    const itemsFormatados = Object.keys(itemsParaBaixar).map((id) => ({
        id: id,
        quantity: itemsParaBaixar[id],
    }));

    if (itemsFormatados.length === 0) return true;

    try {
        const result = await new Promise((resolve, reject) => {
            const callbackName = 'baixa_callback_' + Date.now();
            
            window[callbackName] = function(data) {
                console.log("📥 Resposta baixa estoque:", data);
                delete window[callbackName];
                document.body.removeChild(script);
                resolve(data);
            };
            
            // 🔥 PARAMS CORRETOS
            const params = `modo=admin&tipo=baixa_estoque&items=${encodeURIComponent(JSON.stringify(itemsFormatados))}`;
            const script = document.createElement('script');
            script.src = `${ESTOQUE_API_URL}?${params}&callback=${callbackName}`;
            console.log("📤 Chamando API:", script.src);
            
            script.onerror = function() {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('Erro ao baixar estoque'));
            };
            
            const timeoutId = setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    reject(new Error('Timeout ao baixar estoque'));
                }
            }, 30000);
            
            const originalResolve = resolve;
            resolve = function(data) {
                clearTimeout(timeoutId);
                originalResolve(data);
            };
            
            document.body.appendChild(script);
        });
        
        console.log("✅ Estoque baixado com sucesso:", result);
        return result.success;
    } catch (error) {
        console.error("❌ Erro ao dar baixa no estoque:", error);
        Toastify({
            text: "Erro ao atualizar estoque. Verifique sua conexão.",
            duration: 3000,
            style: { background: "#ef4444" },
        }).showToast();
        return false;
    }
}

// ============================================
// FUNÇÃO FINALIZAR PEDIDO DIRETO
// ============================================
// ============================================
// FUNÇÃO FINALIZAR PEDIDO DIRETO
// ============================================
async function finalizarPedidoDireto() {
    const nomeCliente = document.getElementById("customer-name").value;
    const endereco = document.getElementById("address").value;

    if (cart.length === 0) {
        Toastify({
            text: "Sacola vazia!",
            duration: 2000,
            style: { background: "#ef4444" },
        }).showToast();
        return;
    }
    if (!nomeCliente.trim()) {
        Toastify({
            text: "Por favor, informe seu nome!",
            duration: 2000,
            style: { background: "#ef4444" },
        }).showToast();
        document.getElementById("customer-name").focus();
        return;
    }
    if (!endereco.trim()) {
        Toastify({
            text: "Por favor, informe o endereço!",
            duration: 2000,
            style: { background: "#ef4444" },
        }).showToast();
        document.getElementById("address").focus();
        return;
    }

    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    }

    try {
        // 🔥 CHAMAR BAIXAR ESTOQUE ANTES DE ENVIAR O PEDIDO
        const estoqueAtualizado = await baixarEstoque();
        
        if (!estoqueAtualizado) {
            Toastify({
                text: "⚠️ Erro ao atualizar estoque. Pedido não foi processado.",
                duration: 3000,
                style: { background: "#ef4444" },
            }).showToast();
            return;
        }

        const itensTexto = cart.map(i => `✅ ${i.quantity}x ${i.name}${i.ref ? ` (Ref: ${i.ref})` : ""}`).join("\n");
        const totalFinal = subtotal >= FRETE_GRATIS_VALOR ? subtotal : subtotal + TAXA_FRETE;
        const freteTexto = subtotal >= FRETE_GRATIS_VALOR ? "GRÁTIS" : `R$ ${TAXA_FRETE.toFixed(2).replace(".", ",")}`;

        const mensagem = `🛍️ *NOVO PEDIDO - WRJ JOIAS* 🛍️\n\n👤 *CLIENTE:* ${nomeCliente.toUpperCase()}\n📍 *ENDEREÇO:* ${endereco}\n\n*📦 ITENS DO PEDIDO:*\n${itensTexto}\n\n*💰 RESUMO DO PEDIDO:*\n─────────────────\nSubtotal: R$ ${subtotal.toFixed(2).replace(".", ",")}\nFrete: ${freteTexto}\n─────────────────\n*TOTAL: R$ ${totalFinal.toFixed(2).replace(".", ",")}*\n─────────────────\n\n✨ *Obrigado pela preferência!*\n📲 *WRJ Joias - Qualidade e Elegância*`;

        window.open(`https://wa.me/5588999049636?text=${encodeURIComponent(mensagem)}`, "_blank");

        cart = [];
        updateCart();
        document.getElementById("customer-name").value = "";
        document.getElementById("address").value = "";
        document.getElementById("cart-modal").classList.add("hidden");

        Toastify({
            text: "✅ Pedido enviado! Estoque atualizado. Aguarde nosso contato.",
            duration: 4000,
            style: { background: "#1f4d38" },
        }).showToast();
    } catch (error) {
        console.error("❌ Erro ao finalizar pedido:", error);
        Toastify({
            text: "❌ Erro ao processar pedido. Tente novamente.",
            duration: 3000,
            style: { background: "#ef4444" },
        }).showToast();
    } finally {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Finalizar';
        }
    }
}

// ============================================
// FUNÇÕES DE PDF
// ============================================
function gerarConteudoPDF() {
    const nomeCliente = document.getElementById("customer-name").value || "Não informado";
    const endereco = document.getElementById("address").value || "Não informado";
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const totalFinal = subtotal >= FRETE_GRATIS_VALOR ? subtotal : subtotal + TAXA_FRETE;
    const freteTexto = subtotal >= FRETE_GRATIS_VALOR ? "GRÁTIS" : `R$ ${TAXA_FRETE.toFixed(2).replace(".", ",")}`;

    let itensHTML = "";
    cart.forEach((item, index) => {
        itensHTML += `<tr><td style="padding: 8px 5px;">${index + 1}</td><td style="padding: 8px 5px;">${item.name}${item.ref ? `<br><small>Ref: ${item.ref}</small>` : ""}</td><td style="padding: 8px 5px; text-align: center;">${item.quantity}</td><td style="padding: 8px 5px; text-align: right;">R$ ${item.price.toFixed(2).replace(".", ",")}</td></tr>`;
    });

    return `<div class="pdf-preview-content" id="pdf-content-to-print">
        <div class="pdf-header">
            <h2>WRJ JOIAS</h2>
            <p>Joias e Acessórios de Luxo</p>
            <p style="font-size: 10px;">Pedido gerado em ${dataAtual} às ${horaAtual}</p>
        </div>
        <div class="pdf-client-info">
            <p><strong>👤 Cliente:</strong> ${nomeCliente.toUpperCase()}</p>
            <p><strong>📍 Endereço:</strong> ${endereco}</p>
        </div>
        <table class="pdf-items-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="background: #eef4ef; padding: 10px 5px;">#</th>
                    <th style="background: #eef4ef; padding: 10px 5px;">Produto</th>
                    <th style="background: #eef4ef; padding: 10px 5px; text-align: center;">Qtd</th>
                    <th style="background: #eef4ef; padding: 10px 5px; text-align: right;">Valor</th>
                </tr>
            </thead>
            <tbody>${itensHTML}</tbody>
        </table>
        <div class="pdf-total">
            <p>Subtotal: R$ ${subtotal.toFixed(2).replace(".", ",")}</p>
            <p>Frete: ${freteTexto}</p>
            <p style="font-size: 18px; margin-top: 10px;"><strong>TOTAL: R$ ${totalFinal.toFixed(2).replace(".", ",")}</strong></p>
        </div>
        <div class="pdf-footer">
            <p>WRJ Joias - Qualidade e Elegância</p>
            <p>Crato, CE | (88) 99904-9636 | @wrj_joias</p>
        </div>
    </div>`;
}

async function visualizarPDF() {
    if (cart.length === 0) {
        Toastify({ text: "Sacola vazia!", duration: 2000, style: { background: "#ef4444" } }).showToast();
        return;
    }
    if (!document.getElementById("customer-name").value.trim()) {
        Toastify({ text: "Informe seu nome!", duration: 2000, style: { background: "#ef4444" } }).showToast();
        return;
    }
    if (!document.getElementById("address").value.trim()) {
        Toastify({ text: "Informe o endereço!", duration: 2000, style: { background: "#ef4444" } }).showToast();
        return;
    }
    document.getElementById("pdf-preview-content").innerHTML = gerarConteudoPDF();
    document.getElementById("pdf-preview-modal").classList.remove("hidden");
    document.getElementById("pdf-preview-modal").classList.add("flex");
}

async function downloadPDF() {
    let element = document.getElementById("pdf-content-to-print");
    if (!element) {
        await visualizarPDF();
        setTimeout(() => downloadPDF(), 500);
        return;
    }
    Toastify({ text: "Gerando PDF...", duration: 2000, style: { background: "#2f6b4f" } }).showToast();
    try {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 10, 0, imgWidth, imgHeight);
        pdf.save(`Pedido_WRJ_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`);
        Toastify({ text: "PDF baixado!", duration: 3000, style: { background: "#1f4d38" } }).showToast();
    } catch (error) {
        Toastify({ text: "Erro ao gerar PDF", duration: 3000, style: { background: "#ef4444" } }).showToast();
    }
}

async function enviarPDFWhatsApp() {
    let element = document.getElementById("pdf-content-to-print");
    if (!element) {
        await visualizarPDF();
        setTimeout(() => enviarPDFWhatsApp(), 500);
        return;
    }
    const nomeCliente = document.getElementById("customer-name").value;
    const endereco = document.getElementById("address").value;
    if (!nomeCliente.trim() || !endereco.trim()) return;

    const sendBtn = document.getElementById("send-pdf-whatsapp-btn");
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }

    try {
        await baixarEstoque();
        const itensTexto = cart.map(i => `✅ ${i.quantity}x ${i.name}${i.ref ? ` (Ref: ${i.ref})` : ""}`).join("\n");
        const totalFinal = subtotal >= FRETE_GRATIS_VALOR ? subtotal : subtotal + TAXA_FRETE;
        const freteTexto = subtotal >= FRETE_GRATIS_VALOR ? "GRÁTIS" : `R$ ${TAXA_FRETE.toFixed(2).replace(".", ",")}`;
        const mensagem = `🛍️ *NOVO PEDIDO - WRJ JOIAS* 🛍️\n\n👤 *CLIENTE:* ${nomeCliente.toUpperCase()}\n📍 *ENDEREÇO:* ${endereco}\n\n*📦 ITENS DO PEDIDO:*\n${itensTexto}\n\n*💰 RESUMO:*\nSubtotal: R$ ${subtotal.toFixed(2).replace(".", ",")}\nFrete: ${freteTexto}\n*TOTAL: R$ ${totalFinal.toFixed(2).replace(".", ",")}*\n\n✨ *Obrigado pela preferência!*`;
        window.open(`https://wa.me/5588999049636?text=${encodeURIComponent(mensagem)}`, "_blank");
        Toastify({ text: "Pedido enviado! Estoque atualizado.", duration: 4000, style: { background: "#1f4d38" } }).showToast();
        cart = [];
        updateCart();
        document.getElementById("customer-name").value = "";
        document.getElementById("address").value = "";
        document.getElementById("pdf-preview-modal").classList.add("hidden");
        document.getElementById("cart-modal").classList.add("hidden");
    } catch (error) {
        Toastify({ text: "Erro ao processar pedido", duration: 3000, style: { background: "#ef4444" } }).showToast();
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Enviar via WhatsApp';
        }
    }
}

// ============================================
// BANNER HERO
// ============================================
async function carregarBannerHero() {
    try {
        const response = await fetch(BANNERS_CSV_URL);
        const data = await response.text();
        const rows = parseCSV(data);
        const wrapper = document.querySelector(".heroSwiper .swiper-wrapper");
        if (!wrapper) return;
        wrapper.innerHTML = "";
        
        let hasBanners = false;
        rows.slice(1).forEach((row) => {
            const img = row[0]?.replace(/"/g, "").trim();
            const titulo = row[1]?.replace(/"/g, "").trim();
            const btnText = row[2]?.replace(/"/g, "").trim();
            const btnLink = row[3]?.replace(/"/g, "").trim();
            const ativo = row[4]?.replace(/"/g, "").trim().toLowerCase();
            if (ativo !== "sim") return;
            if (!titulo) return;
            hasBanners = true;
            const slide = document.createElement("div");
            slide.className = "swiper-slide relative";
            slide.innerHTML = `
                <img src="${driveImg(img)}" class="absolute inset-0 w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/1200x800?text=WRJ+Joias'">
                <div class="absolute inset-0 bg-gradient-to-t from-accent/70 via-accent/20 to-transparent"></div>
                <div class="relative h-full flex items-center justify-center text-center text-white px-4">
                    <div>
                        <h2 class="text-3xl md:text-5xl font-bold mb-4 font-serif">${titulo}</h2>
                        ${btnText && btnLink ? `<a href="${btnLink}" class="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primaryDark transition">${btnText}</a>` : ""}
                    </div>
                </div>
            `;
            wrapper.appendChild(slide);
        });
        
        if (!hasBanners) {
            const slide = document.createElement("div");
            slide.className = "swiper-slide relative";
            slide.innerHTML = `
                <img src="assets/logo_wrjoias.png" class="absolute inset-0 w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-accent/70 via-accent/20 to-transparent"></div>
                <div class="relative h-full flex items-center justify-center text-center text-white px-4">
                    <div>
                        <h2 class="text-3xl md:text-5xl font-bold mb-4 font-serif">WRJ Joias</h2>
                        <p class="text-lg md:text-xl">Qualidade e Elegância</p>
                    </div>
                </div>
            `;
            wrapper.appendChild(slide);
        }
        
        if (heroSwiper) heroSwiper.destroy();
        heroSwiper = new Swiper(".heroSwiper", {
            loop: true,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: ".swiper-pagination", clickable: true },
        });
    } catch (err) {
        console.error("Erro banners:", err);
    }
}

// ============================================
// FUNÇÃO DE BUSCA
// ============================================
function performSearch(termo) {
    const termoNormalizado = normalizar(termo);
    const filtrados = allProducts.filter(p => 
        normalizar(p["Nome do Produto"]).includes(termoNormalizado) || 
        normalizar(p["referencia"]).includes(termoNormalizado)
    );
    renderProducts(filtrados);
}

// ============================================
// FECHAR MODAIS COM ESC
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharZoom();
        closeSizeModal();
        document.getElementById("cart-modal").classList.add("hidden");
        document.getElementById("cart-modal").classList.remove("flex");
        document.getElementById("pdf-preview-modal").classList.add("hidden");
        document.getElementById("pdf-preview-modal").classList.remove("flex");
    }
    if (e.key === 'ArrowLeft') zoomAnterior();
    if (e.key === 'ArrowRight') zoomProximo();
});

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener("DOMContentLoaded", function() {
    // Filtros do menu mobile
    document.querySelectorAll(".filtro-menu-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const categoria = normalizar(btn.getAttribute("data-categoria"));
            document.getElementById("mobile-menu")?.classList.add("translate-x-full");
            document.getElementById("mobile-overlay")?.classList.add("hidden");
            const filtrados = categoria === "todos" ? allProducts : allProducts.filter((p) => normalizar(p["Categoria"]).includes(categoria));
            renderProducts(filtrados);
            document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
        })
    );

    // Search Desktop
    document.getElementById("search-input-desktop")?.addEventListener("input", (e) => {
        performSearch(e.target.value);
    });

    // Search Mobile
    document.getElementById("search-input-mobile")?.addEventListener("input", (e) => {
        performSearch(e.target.value);
    });

    // Alternar busca mobile
    const mobileSearchToggle = document.querySelector('[data-search-toggle]');
    const searchOverlay = document.getElementById('search-overlay');
    if (mobileSearchToggle && searchOverlay) {
        mobileSearchToggle.addEventListener('click', () => {
            searchOverlay.classList.remove('-translate-y-full');
            document.getElementById('search-input-mobile')?.focus();
        });
    }
    document.getElementById('mobile-search-close')?.addEventListener('click', () => {
        document.getElementById('search-overlay')?.classList.add('-translate-y-full');
    });

    // Carrinho
    document.getElementById("cart-btn")?.addEventListener("click", () => {
        document.getElementById("cart-modal")?.classList.remove("hidden");
        document.getElementById("cart-modal")?.classList.add("flex");
    });

    document.getElementById("close-modal-btn")?.addEventListener("click", () => {
        document.getElementById("cart-modal")?.classList.add("hidden");
        document.getElementById("cart-modal")?.classList.remove("flex");
    });

    document.getElementById("checkout-btn")?.addEventListener("click", finalizarPedidoDireto);
    document.getElementById("pdf-preview-btn")?.addEventListener("click", visualizarPDF);
    
    document.getElementById("close-pdf-modal")?.addEventListener("click", () => {
        document.getElementById("pdf-preview-modal").classList.add("hidden");
        document.getElementById("pdf-preview-modal").classList.remove("flex");
    });
    
    document.getElementById("download-pdf-btn")?.addEventListener("click", downloadPDF);
    document.getElementById("send-pdf-whatsapp-btn")?.addEventListener("click", enviarPDFWhatsApp);

    // Limpar carrinho
    const clearBtn = document.getElementById("clear-cart-btn");
    const confirmModal = document.getElementById("confirm-clear-modal");
    if (clearBtn && confirmModal) {
        clearBtn.onclick = () => confirmModal.classList.remove("hidden");
        document.getElementById("cancel-clear-btn").onclick = () => confirmModal.classList.add("hidden");
        document.getElementById("confirm-clear-btn").onclick = () => {
            cart = [];
            updateCart();
            confirmModal.classList.add("hidden");
        };
    }

    // Menu mobile
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileOverlay = document.getElementById("mobile-overlay");
    const closeMobile = document.getElementById("close-mobile-menu");

    mobileMenuBtn?.addEventListener("click", () => {
        mobileMenu?.classList.remove("translate-x-full");
        mobileOverlay?.classList.remove("hidden");
    });
    closeMobile?.addEventListener("click", () => {
        mobileMenu?.classList.add("translate-x-full");
        mobileOverlay?.classList.add("hidden");
    });
    mobileOverlay?.addEventListener("click", () => {
        mobileMenu?.classList.add("translate-x-full");
        mobileOverlay?.classList.add("hidden");
    });

    // Fechar modais clicando fora
    document.getElementById("cart-modal")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("cart-modal")) {
            document.getElementById("cart-modal").classList.add("hidden");
            document.getElementById("cart-modal").classList.remove("flex");
        }
    });

    document.getElementById("size-modal")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("size-modal")) closeSizeModal();
    });

    document.getElementById("image-zoom-modal")?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("image-zoom-modal")) fecharZoom();
    });

    // Quantidade customizada
    document.getElementById("add-custom-qty")?.addEventListener("click", () => {
        const qty = parseInt(document.getElementById("custom-quantity").value);
        if (qty && qty > 0) finishSelection(qty);
        else Toastify({ text: "Digite uma quantidade válida", duration: 2000, style: { background: "#ef4444" } }).showToast();
    });
});

// ============================================
// INICIALIZAÇÃO
// ============================================
window.onload = function() {
    loadProducts();
    carregarBannerHero();
    updateCart();
    initCategoriesSwiper();
    
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('busca');
    if (searchParam) {
        document.getElementById('search-input-desktop').value = searchParam;
        performSearch(searchParam);
    }
};
