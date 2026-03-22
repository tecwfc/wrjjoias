// script.js
// CONFIGURAÇÕES
const PRODUCTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTlzX4j6lQhRTjlXLISjyeSlT9Bs2sl0pWOboXfnkVz4rKtWYCpjtE2QC92B5bHbeT1i_jDHc5X3D5k/pub?gid=197993066&single=true&output=csv";
const BANNERS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTlzX4j6lQhRTjlXLISjyeSlT9Bs2sl0pWOboXfnkVz4rKtWYCpjtE2QC92B5bHbeT1i_jDHc5X3D5k/pub?gid=1298353831&single=true&output=csv";
const ESTOQUE_API_URL =
  "https://script.google.com/macros/s/AKfycby0gq6iJuLdXJU8NwvoaMfgH5mVLW1gscyaqubW5UPMwGNW2q7zCmcLKopYj42hnTPGEQ/exec";

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

const coresMap = {
  cristal: "#e0e0e0",
  vermelho: "#ff0000",
  azul: "#0000ff",
  rosa: "#ff69b4",
  preto: "#000000",
  esmeralda: "#50c878",
  aqua: "#7fffd4",
  saphire: "#0f52ba",
  verde: "#00ff00",
  sortidos: "linear-gradient(45deg, #ff0000, #00ff00, #0000ff)",
};

function normalizar(texto) {
  if (!texto) return "";
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function driveImg(url) {
  if (!url) return "https://via.placeholder.com/400";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return url;
  return `https://lh3.googleusercontent.com/u/0/d/${match[1]}=w800`;
}

// FUNÇÃO PARA DAR BAIXA NO ESTOQUE
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
    await fetch(ESTOQUE_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "baixa_estoque",
        items: itemsFormatados,
      }),
    });
    return true;
  } catch (error) {
    console.error("Erro ao dar baixa no estoque:", error);
    return false;
  }
}

function updateCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  document.getElementById("cart-count").innerText = cart.reduce(
    (t, i) => t + i.quantity,
    0
  );
  const container = document.getElementById("cart-items");
  container.innerHTML = "";
  subtotal = 0;

  cart.forEach((item) => {
    subtotal += item.price * item.quantity;
    const div = document.createElement("div");
    div.className =
      "flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-2xl mb-2 border";
    div.innerHTML = `
      <img src="${driveImg(item.img)}" class="w-14 h-14 rounded-xl object-cover flex-shrink-0">
      <div class="flex-1 w-full">
        <h4 class="text-[11px] font-bold text-slate-800">${item.name}</h4>
        ${
          item.ref
            ? `<p class="ref-text text-[10px] mt-1">Ref: ${item.ref}</p>`
            : ""
        }
        <div class="flex justify-between items-center mt-2">
          <p class="font-black text-primary text-sm">R$ ${(
            item.price * item.quantity
          )
            .toFixed(2)
            .replace(".", ",")}</p>
          <div class="flex gap-2 bg-slate-100 px-2 py-1 rounded-lg">
            <button onclick="changeQty('${item.id}', -1)" class="text-xs font-bold text-primary w-6 h-6 rounded-full hover:bg-primary/10">-</button>
            <span class="text-xs font-bold w-6 text-center">${
              item.quantity
            }</span>
            <button onclick="changeQty('${item.id}', 1)" class="text-xs font-bold text-primary w-6 h-6 rounded-full hover:bg-primary/10">+</button>
          </div>
        </div>
      </div>
      <button onclick="removeCartItem('${item.id}')" class="text-slate-400 hover:text-red-500 transition-colors text-xs flex items-center gap-1 mt-2 sm:mt-0"><i class="fas fa-trash-alt"></i> Remover</button>`;
    container.appendChild(div);
  });

  const bar = document.getElementById("free-shipping-bar");
  const text = document.getElementById("free-shipping-text");
  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");
  const clearBtn = document.getElementById("clear-cart-btn");

  subtotalEl.innerText = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;

  if (subtotal >= FRETE_GRATIS_VALOR) {
    bar.style.width = "100%";
    text.innerHTML = "🎉 Frete GRÁTIS!";
    shippingEl.innerText = "GRÁTIS";
    totalEl.innerText = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
  } else {
    const percent = (subtotal / FRETE_GRATIS_VALOR) * 100;
    const falta = FRETE_GRATIS_VALOR - subtotal;
    bar.style.width = `${percent}%`;
    text.innerHTML = `Faltam R$ ${falta
      .toFixed(2)
      .replace(".", ",")} para frete grátis`;
    shippingEl.innerText = `R$ ${TAXA_FRETE.toFixed(2).replace(".", ",")}`;
    totalEl.innerText = `R$ ${(subtotal + TAXA_FRETE)
      .toFixed(2)
      .replace(".", ",")}`;
  }

  // Botão Limpar Sacola - sempre visível quando há itens
  if (clearBtn) {
    if (cart.length === 0) {
      clearBtn.classList.add("hidden");
    } else {
      clearBtn.classList.remove("hidden");
    }
  }
}

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

function addToCart(id, name, price, img, baseId, ref) {
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    const precoUnitario = existing.price / existing.quantity;
    existing.quantity++;
    existing.price = precoUnitario * existing.quantity;
  } else {
    cart.push({
      id,
      name,
      price,
      img,
      quantity: 1,
      baseId: baseId,
      ref: ref,
    });
  }
  Toastify({
    text: `${name.substring(0, 30)} adicionado!`,
    duration: 2000,
    style: { background: "#b1936b" },
  }).showToast();
  updateCart();
}

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
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

  try {
    await baixarEstoque();

    const itensTexto = cart
      .map(
        (i) =>
          `✅ ${i.quantity}x ${i.name}${i.ref ? ` (Ref: ${i.ref})` : ""}`
      )
      .join("\n");
    const totalFinal =
      subtotal >= FRETE_GRATIS_VALOR ? subtotal : subtotal + TAXA_FRETE;
    const freteTexto =
      subtotal >= FRETE_GRATIS_VALOR
        ? "GRÁTIS"
        : `R$ ${TAXA_FRETE.toFixed(2).replace(".", ",")}`;

    const mensagem = `🛍️ *NOVO PEDIDO - WRJ JOIAS* 🛍️\n\n👤 *CLIENTE:* ${nomeCliente.toUpperCase()}\n📍 *ENDEREÇO:* ${endereco}\n\n*📦 ITENS DO PEDIDO:*\n${itensTexto}\n\n*💰 RESUMO DO PEDIDO:*\n─────────────────\nSubtotal: R$ ${subtotal
      .toFixed(2)
      .replace(".", ",")}\nFrete: ${freteTexto}\n─────────────────\n*TOTAL: R$ ${totalFinal
      .toFixed(2)
      .replace(".", ",")}*\n─────────────────\n\n✨ *Obrigado pela preferência!*\n📲 *WRJ Joias - Qualidade e Elegância*`;

    window.open(
      `https://wa.me/5588999049636?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );

    cart = [];
    updateCart();
    document.getElementById("customer-name").value = "";
    document.getElementById("address").value = "";
    document.getElementById("cart-modal").classList.add("hidden");

    Toastify({
      text: "Pedido enviado! Estoque atualizado. Aguarde nosso contato.",
      duration: 4000,
      style: { background: "#27ae60" },
    }).showToast();
  } catch (error) {
    Toastify({
      text: "Erro ao processar pedido. Tente novamente.",
      duration: 3000,
      style: { background: "#ef4444" },
    }).showToast();
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Finalizar';
  }
}

function gerarConteudoPDF() {
  const nomeCliente =
    document.getElementById("customer-name").value || "Não informado";
  const endereco = document.getElementById("address").value || "Não informado";
  const dataAtual = new Date().toLocaleDateString("pt-BR");
  const horaAtual = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const totalFinal =
    subtotal >= FRETE_GRATIS_VALOR ? subtotal : subtotal + TAXA_FRETE;
  const freteTexto =
    subtotal >= FRETE_GRATIS_VALOR
      ? "GRÁTIS"
      : `R$ ${TAXA_FRETE.toFixed(2).replace(".", ",")}`;

  let itensHTML = "";
  cart.forEach((item, index) => {
    itensHTML += `<tr><td style="padding: 8px 5px;">${index + 1}</td><td style="padding: 8px 5px;">${
      item.name
    }${
      item.ref ? `<br><small>Ref: ${item.ref}</small>` : ""
    }</td><td style="padding: 8px 5px; text-align: center;">${
      item.quantity
    }</td><td style="padding: 8px 5px; text-align: right;">R$ ${(
      item.price * item.quantity
    )
      .toFixed(2)
      .replace(".", ",")}</td></tr>`;
  });

  return `<div class="pdf-preview-content" id="pdf-content-to-print"><div class="pdf-header"><h2>WRJ JOIAS</h2><p>Joias e Acessórios de Luxo</p><p style="font-size: 10px;">Pedido gerado em ${dataAtual} às ${horaAtual}</p></div><div class="pdf-client-info"><p><strong>👤 Cliente:</strong> ${nomeCliente.toUpperCase()}</p><p><strong>📍 Endereço:</strong> ${endereco}</p></div><table class="pdf-items-table" style="width: 100%; border-collapse: collapse;"><thead><tr><th style="background: #f8f5f0; padding: 10px 5px;">#</th><th style="background: #f8f5f0; padding: 10px 5px;">Produto</th><th style="background: #f8f5f0; padding: 10px 5px; text-align: center;">Qtd</th><th style="background: #f8f5f0; padding: 10px 5px; text-align: right;">Valor</th></tr></thead><tbody>${itensHTML}</tbody></table><div class="pdf-total"><p>Subtotal: R$ ${subtotal
    .toFixed(2)
    .replace(".", ",")}</p><p>Frete: ${freteTexto}</p><p style="font-size: 18px; margin-top: 10px;"><strong>TOTAL: R$ ${totalFinal
    .toFixed(2)
    .replace(".", ",")}</strong></p></div><div class="pdf-footer"><p>WRJ Joias - Qualidade e Elegância</p><p>Crato, CE | (88) 99904-9636 | @wrj_joias</p></div></div>`;
}

async function visualizarPDF() {
  if (cart.length === 0) {
    Toastify({
      text: "Sacola vazia!",
      duration: 2000,
      style: { background: "#ef4444" },
    }).showToast();
    return;
  }
  if (!document.getElementById("customer-name").value.trim()) {
    Toastify({
      text: "Informe seu nome!",
      duration: 2000,
      style: { background: "#ef4444" },
    }).showToast();
    return;
  }
  if (!document.getElementById("address").value.trim()) {
    Toastify({
      text: "Informe o endereço!",
      duration: 2000,
      style: { background: "#ef4444" },
    }).showToast();
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
  Toastify({
    text: "Gerando PDF...",
    duration: 2000,
    style: { background: "#b1936b" },
  }).showToast();
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 0, imgWidth, imgHeight);
    pdf.save(
      `Pedido_WRJ_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`
    );
    Toastify({
      text: "PDF baixado!",
      duration: 3000,
      style: { background: "#27ae60" },
    }).showToast();
  } catch (error) {
    Toastify({
      text: "Erro ao gerar PDF",
      duration: 3000,
      style: { background: "#ef4444" },
    }).showToast();
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
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

  try {
    await baixarEstoque();
    const itensTexto = cart
      .map(
        (i) =>
          `✅ ${i.quantity}x ${i.name}${i.ref ? ` (Ref: ${i.ref})` : ""}`
      )
      .join("\n");
    const totalFinal =
      subtotal >= FRETE_GRATIS_VALOR ? subtotal : subtotal + TAXA_FRETE;
    const freteTexto =
      subtotal >= FRETE_GRATIS_VALOR
        ? "GRÁTIS"
        : `R$ ${TAXA_FRETE.toFixed(2).replace(".", ",")}`;
    const mensagem = `🛍️ *NOVO PEDIDO - WRJ JOIAS* 🛍️\n\n👤 *CLIENTE:* ${nomeCliente.toUpperCase()}\n📍 *ENDEREÇO:* ${endereco}\n\n*📦 ITENS DO PEDIDO:*\n${itensTexto}\n\n*💰 RESUMO:*\nSubtotal: R$ ${subtotal
      .toFixed(2)
      .replace(".", ",")}\nFrete: ${freteTexto}\n*TOTAL: R$ ${totalFinal
      .toFixed(2)
      .replace(".", ",")}*\n\n✨ *Obrigado pela preferência!*`;
    window.open(
      `https://wa.me/5588999049636?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
    Toastify({
      text: "Pedido enviado! Estoque atualizado.",
      duration: 4000,
      style: { background: "#27ae60" },
    }).showToast();
    cart = [];
    updateCart();
    document.getElementById("customer-name").value = "";
    document.getElementById("address").value = "";
    document.getElementById("pdf-preview-modal").classList.add("hidden");
    document.getElementById("cart-modal").classList.add("hidden");
  } catch (error) {
    Toastify({
      text: "Erro ao processar pedido",
      duration: 3000,
      style: { background: "#ef4444" },
    }).showToast();
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Enviar via WhatsApp';
  }
}

async function loadProducts() {
  try {
    const response = await fetch(PRODUCTS_CSV_URL);
    const data = await response.text();
    const rows = data.split(/\r?\n/).filter((r) => r.trim());
    const headers = rows[0].split(",").map((h) => h.replace(/"/g, "").trim());
    allProducts = rows
      .slice(1)
      .map((row) => {
        const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const obj = {};
        headers.forEach((h, i) => {
          let val = values[i] ? values[i].replace(/"/g, "").trim() : "";
          if (h === "Preço")
            obj[h] =
              parseFloat(val.replace("R$", "").replace(",", ".")) || 0;
          else obj[h] = val;
        });
        return obj;
      })
      .filter((p) => p["Nome do Produto"]);
    renderProducts(allProducts);
    renderDestaques(allProducts);
  } catch (err) {
    console.error("Erro:", err);
  }
}

function renderProducts(products) {
  const container = document.getElementById("produtos-container");
  container.innerHTML = "";
  products.forEach((p) => {
    const estoque = parseInt(p["Saldo Estoque"]) || 0;
    if (estoque <= 0) return;
    const card = document.createElement("div");
    card.className = "bg-white rounded-3xl overflow-hidden border shadow-sm";
    card.innerHTML = `<div class="relative aspect-square bg-slate-50"><img src="${driveImg(
      p["Imagem"]
    )}" class="w-full h-full object-cover">${
      estoque <= 3
        ? '<div class="absolute bottom-2 right-2 bg-orange-500 text-white text-[8px] font-bold px-2 py-1 rounded">ÚLTIMAS</div>'
        : ""
    }</div><div class="p-4"><h3 class="font-bold text-sm">${
      p["Nome do Produto"]
    }</h3>${
      p["referencia"]
        ? `<p class="ref-text text-xs">Ref: ${p["referencia"]}</p>`
        : ""
    }<p class="text-lg font-black text-primary mt-2">R$ ${p["Preço"]
      .toFixed(2)
      .replace(".", ",")}</p><button onclick='openSizeSelector("${p["ID"]}", "${p[
      "Nome do Produto"
    ].replace(/'/g, "\\'")}", "${p["referencia"] || ""}", ${p["Preço"]}, "${p[
      "Imagem"
    ]}")' class="w-full mt-3 py-2 rounded-xl font-bold text-xs bg-primary text-white hover:bg-accent">Escolher Opções</button></div>`;
    container.appendChild(card);
  });
}

function renderDestaques(products) {
  const destaques = products
    .filter(
      (p) => p["Destaque"] === "sim" && parseInt(p["Saldo Estoque"]) > 0
    )
    .slice(0, 12);
  const container = document.getElementById("destaques-container");
  if (!container) return;
  container.innerHTML = "";
  destaques.forEach((p) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.innerHTML = `<div class="bg-white rounded-3xl overflow-hidden border shadow-lg h-full flex flex-col"><div class="relative h-48 bg-slate-50 flex items-center justify-center"><img src="${driveImg(
      p["Imagem"]
    )}" class="max-h-full max-w-full object-contain"><span class="absolute top-2 left-2 bg-primary text-white text-[10px] px-2 py-1 rounded">Destaque</span></div><div class="p-4 flex-1"><h3 class="font-bold text-sm">${
      p["Nome do Produto"]
    }</h3>${
      p["referencia"]
        ? `<p class="ref-text text-xs">Ref: ${p["referencia"]}</p>`
        : ""
    }<p class="text-lg font-black text-primary">R$ ${p["Preço"]
      .toFixed(2)
      .replace(".", ",")}</p><button onclick='openSizeSelector("${p["ID"]}", "${p[
      "Nome do Produto"
    ].replace(/'/g, "\\'")}", "${p["referencia"] || ""}", ${p["Preço"]}, "${p[
      "Imagem"
    ]}")' class="w-full mt-3 py-2 rounded-xl font-bold text-xs bg-primary text-white">Comprar</button></div></div>`;
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

function initCategoriesSwiper() {
  const categoriesData = [
    { name: "✨ INÍCIO", categoria: "todos", type: "simple" },
    { name: "💍 ANÉIS", categoria: "aneis", type: "simple" },
    {
      name: "💎 BRINCOS",
      categoria: "brincos",
      type: "dropdown",
      subitems: ["Todos os Brincos", "Brincos de Moda", "Brincos Pressão"],
    },
    {
      name: "⛓️ CORRENTES",
      categoria: "correntes",
      type: "dropdown",
      subitems: [
        "Todas as Correntes",
        "Correntes Feminina",
        "Correntes Masculina",
      ],
    },
    {
      name: "⌚ PULSEIRAS",
      categoria: "pulseiras",
      type: "dropdown",
      subitems: [
        "Todas as Pulseiras",
        "Pulseiras Feminina",
        "Pulseiras Masculina",
        "Pulseiras Infantis",
      ],
    },
    { name: "📿 COLARES", categoria: "colares", type: "simple" },
    {
      name: "✨ GARGANTILHAS",
      categoria: "gargantilhas",
      type: "simple",
    },
    { name: "⭐ PINGENTES", categoria: "pingentes", type: "simple" },
    { name: "💫 BRACELETES", categoria: "braceletes", type: "simple" },
    {
      name: "🙏 RELIGIOSOS",
      categoria: "religiosos",
      type: "dropdown",
      subitems: ["Terço", "Escapulários"],
    },
    {
      name: "🎁 OUTROS",
      categoria: "outros",
      type: "dropdown",
      subitems: [
        "Coleção Especial",
        "Edição Limitada",
        "Sob Encomenda",
        "Kit Presente",
      ],
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
      btn.className =
        "category-slide-btn text-[11px] font-black uppercase tracking-widest hover:text-primary transition px-4 py-2";
      btn.innerText = cat.name;
      btn.onclick = () => {
        const filtrados =
          cat.categoria === "todos"
            ? allProducts
            : allProducts.filter((p) =>
                normalizar(p["Categoria"]).includes(cat.categoria)
              );
        renderProducts(filtrados);
        document
          .getElementById("produtos")
          .scrollIntoView({ behavior: "smooth" });
      };
      slide.appendChild(btn);
    } else if (cat.type === "dropdown") {
      const div = document.createElement("div");
      div.className = "dropdown";
      const trigger = document.createElement("button");
      trigger.className =
        "category-slide-btn text-[11px] font-black uppercase tracking-widest hover:text-primary transition flex items-center gap-1 px-4 py-2";
      trigger.innerHTML = `${cat.name} <i class="fa-solid fa-chevron-down text-[8px]"></i>`;
      const menu = document.createElement("div");
      menu.className = "dropdown-menu";
      cat.subitems.forEach((sub) => {
        const a = document.createElement("a");
        a.innerText = sub;
        a.onclick = (e) => {
          e.preventDefault();
          const filtrados = allProducts.filter((p) =>
            normalizar(p["Categoria"]).includes(normalizar(sub))
          );
          renderProducts(filtrados);
          document
            .getElementById("produtos")
            .scrollIntoView({ behavior: "smooth" });
        };
        menu.appendChild(a);
      });
      div.appendChild(trigger);
      div.appendChild(menu);
      slide.appendChild(div);
    } else if (cat.type === "link") {
      const a = document.createElement("a");
      a.href = cat.link;
      a.className =
        "category-slide-btn text-[11px] font-black uppercase tracking-widest hover:text-primary transition px-4 py-2 no-underline text-textDark";
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

window.openSizeSelector = function (id, name, ref, price, img) {
  const p = allProducts.find(
    (prod) => prod["ID"].toString() === id.toString()
  );
  if (!p) return;
  tempProduct = { id: p["ID"], name, price, img, ref: ref };
  selectedColor = "";
  document.getElementById("size-product-name").innerText = name;
  document.getElementById("size-product-ref").innerText = ref
    ? `Ref: ${ref}`
    : "";
  document.getElementById("size-product-price").innerText = `R$ ${price
    .toFixed(2)
    .replace(".", ",")} cada`;
  const colorContainer = document.getElementById("colors-container");
  colorContainer.innerHTML = "";
  if (p["Cores"] && p["Cores"].trim()) {
    p["Cores"].split(",").forEach((cor) => {
      const nomeCor = cor.trim();
      const corHex = coresMap[nomeCor.toLowerCase()] || "#cbd5e1";
      const btn = document.createElement("button");
      btn.className =
        "w-10 h-10 rounded-full border-2 border-white shadow-sm ring-2 ring-slate-100 hover:ring-primary transition-all";
      btn.style.background = corHex;
      btn.title = nomeCor;
      btn.onclick = () => selectColor(nomeCor);
      colorContainer.appendChild(btn);
    });
    document.getElementById("color-step").classList.remove("hidden");
  } else {
    selectedColor = "Todas as cores";
    document.getElementById("color-step").classList.add("hidden");
    document.getElementById("size-step").classList.remove("hidden");
    document.getElementById("modal-step-title").innerText =
      "Selecione a Quantidade";
  }
  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";
  let quantidades = [];
  if (p["Quantidade"] && p["Quantidade"].trim())
    quantidades = p["Quantidade"]
      .split(",")
      .map((q) => parseInt(q.trim()))
      .filter((q) => !isNaN(q));
  if (quantidades.length === 0) quantidades = [5, 10, 15, 20, 25, 30];
  quantidades.forEach((qtd) => {
    const btn = document.createElement("button");
    btn.className =
      "py-2 border rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition";
    btn.innerText = qtd;
    btn.onclick = () => finishSelection(qtd);
    optionsContainer.appendChild(btn);
  });
  document.getElementById("size-modal").classList.remove("hidden");
  document.getElementById("size-modal").classList.add("flex");
};

function selectColor(cor) {
  selectedColor = cor;
  document.getElementById("color-step").classList.add("hidden");
  document.getElementById("size-step").classList.remove("hidden");
  document.getElementById("modal-step-title").innerText =
    "Selecione a Quantidade";
}

function finishSelection(quantidade) {
  if (!tempProduct) return;
  const corFinal = selectedColor || "Todas as cores";
  const uniqueId = `${tempProduct.id}-${corFinal}-${quantidade}-${Date.now()}`;
  const fullName = `${tempProduct.name} - ${corFinal}`;
  const totalPrice = tempProduct.price * quantidade;
  addToCart(
    uniqueId,
    fullName,
    totalPrice,
    tempProduct.img,
    tempProduct.id,
    tempProduct.ref
  );
  closeSizeModal();
}

window.closeSizeModal = function () {
  document.getElementById("size-modal").classList.add("hidden");
  document.getElementById("size-modal").classList.remove("flex");
  selectedColor = "";
  tempProduct = null;
};

async function carregarBannerHero() {
  try {
    const response = await fetch(BANNERS_CSV_URL);
    const data = await response.text();
    const rows = data.split(/\r?\n/).filter((r) => r.trim());
    const wrapper = document.querySelector(".heroSwiper .swiper-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = "";
    rows.slice(1).forEach((row) => {
      const cols = row.split(",");
      const img = cols[0]?.replace(/"/g, "").trim();
      const titulo = cols[1]?.replace(/"/g, "").trim();
      const btnText = cols[2]?.replace(/"/g, "").trim();
      const btnLink = cols[3]?.replace(/"/g, "").trim();
      const ativo = cols[4]?.replace(/"/g, "").trim().toLowerCase();
      if (ativo !== "sim") return;
      const slide = document.createElement("div");
      slide.className = "swiper-slide relative";
      slide.innerHTML = `<img src="${driveImg(
        img
      )}" class="absolute inset-0 w-full h-full object-cover"><div class="absolute inset-0 bg-black/30"></div><div class="relative h-full flex items-center justify-center text-center text-white px-4"><div><h2 class="text-3xl md:text-5xl font-bold mb-4">${titulo}</h2><a href="${btnLink}" class="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-accent">${btnText}</a></div></div>`;
      wrapper.appendChild(slide);
    });
    if (heroSwiper) heroSwiper.destroy();
    heroSwiper = new Swiper(".heroSwiper", {
      loop: true,
      autoplay: { delay: 5000 },
      pagination: { el: ".swiper-pagination", clickable: true },
    });
  } catch (err) {
    console.error("Erro banners:", err);
  }
}

// Event Listeners
document.querySelectorAll(".filtro-menu-btn").forEach((btn) =>
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const categoria = normalizar(btn.getAttribute("data-categoria"));
    document
      .getElementById("mobile-menu")
      ?.classList.add("translate-x-full");
    document.getElementById("mobile-overlay")?.classList.add("hidden");
    const filtrados =
      categoria === "todos"
        ? allProducts
        : allProducts.filter((p) =>
            normalizar(p["Categoria"]).includes(categoria)
          );
    renderProducts(filtrados);
    document
      .getElementById("produtos")
      .scrollIntoView({ behavior: "smooth" });
  })
);

document
  .getElementById("search-input-desktop")
  ?.addEventListener("input", (e) => {
    const termo = normalizar(e.target.value);
    const filtrados = allProducts.filter(
      (p) =>
        normalizar(p["Nome do Produto"]).includes(termo) ||
        normalizar(p["referencia"]).includes(termo)
    );
    renderProducts(filtrados);
  });

document.getElementById("cart-btn").onclick = () => {
  document.getElementById("cart-modal").classList.remove("hidden");
  document.getElementById("cart-modal").classList.add("flex");
};

document.getElementById("close-modal-btn").onclick = () => {
  document.getElementById("cart-modal").classList.add("hidden");
  document.getElementById("cart-modal").classList.remove("flex");
};

document
  .getElementById("checkout-btn")
  ?.addEventListener("click", finalizarPedidoDireto);
document
  .getElementById("pdf-preview-btn")
  ?.addEventListener("click", visualizarPDF);
document.getElementById("close-pdf-modal")?.addEventListener("click", () => {
  document.getElementById("pdf-preview-modal").classList.add("hidden");
  document.getElementById("pdf-preview-modal").classList.remove("flex");
});
document
  .getElementById("download-pdf-btn")
  ?.addEventListener("click", downloadPDF);
document
  .getElementById("send-pdf-whatsapp-btn")
  ?.addEventListener("click", enviarPDFWhatsApp);

const clearBtn = document.getElementById("clear-cart-btn");
const confirmModal = document.getElementById("confirm-clear-modal");
if (clearBtn) {
  clearBtn.onclick = () => confirmModal.classList.remove("hidden");
  document.getElementById("cancel-clear-btn").onclick = () =>
    confirmModal.classList.add("hidden");
  document.getElementById("confirm-clear-btn").onclick = () => {
    cart = [];
    updateCart();
    confirmModal.classList.add("hidden");
  };
}

const mobileMenuBtn = document.getElementById("mobile-menu-btn"),
  mobileMenu = document.getElementById("mobile-menu"),
  mobileOverlay = document.getElementById("mobile-overlay"),
  closeMobile = document.getElementById("close-mobile-menu");
mobileMenuBtn?.addEventListener("click", () => {
  mobileMenu.classList.remove("translate-x-full");
  mobileOverlay.classList.remove("hidden");
});
closeMobile?.addEventListener("click", () => {
  mobileMenu.classList.add("translate-x-full");
  mobileOverlay.classList.add("hidden");
});
mobileOverlay?.addEventListener("click", () => {
  mobileMenu.classList.add("translate-x-full");
  mobileOverlay.classList.add("hidden");
});

// Inicialização
window.onload = () => {
  loadProducts();
  carregarBannerHero();
  updateCart();
  initCategoriesSwiper();
};

document.getElementById("cart-modal")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("cart-modal")) {
    document.getElementById("cart-modal").classList.add("hidden");
    document.getElementById("cart-modal").classList.remove("flex");
  }
});

document.getElementById("size-modal")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("size-modal")) closeSizeModal();
});

document.getElementById("add-custom-qty")?.addEventListener("click", () => {
  const qty = parseInt(document.getElementById("custom-quantity").value);
  if (qty && qty > 0) finishSelection(qty);
  else alert("Digite uma quantidade válida");
});