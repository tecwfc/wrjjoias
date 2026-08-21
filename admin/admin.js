// // ============================================
// // ADMIN - CONFIGURAÇÕES
// // ============================================
// const API_WRITE_URL = "https://script.google.com/macros/s/AKfycbyjKxpcfe1PwyOUu8cCeqR7RacL7BQdu95AOCvGUZciREFje-9OH-t28aZNgmgpcmdcNg/exec";

// const PLANILHA_ID = "1AL1_DDF9dOO-qS_fnEBoz94687lYp7rqIVLFnUT7ch8";

// const PRODUCTS_CSV_URL = `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/export?format=csv&gid=1810786293`;
// const BANNERS_CSV_URL = `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/export?format=csv&gid=1271686459`;
// const CATEGORIAS_CSV_URL = `https://docs.google.com/spreadsheets/d/${PLANILHA_ID}/export?format=csv&gid=0`;

// // ============================================
// // SVG PLACEHOLDER (NUNCA USA via.placeholder.com)
// // ============================================
// const SVG_PLACEHOLDER_100 = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="10" text-anchor="middle" dy=".3em" fill="%239ca3af"%3ESem Imagem%3C/text%3E%3C/svg%3E`;

// const SVG_PLACEHOLDER_150 = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3E%3Crect width="150" height="150" fill="%23f3f4f6"/%3E%3Ctext x="75" y="75" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="%239ca3af"%3ESem Imagem%3C/text%3E%3C/svg%3E`;

// // ============================================
// // FUNÇÃO PARA EXTRAIR ID DO GOOGLE DRIVE
// // ============================================
// function getDriveImageId(url) {
//     if (!url) return null;
//     const patterns = [
//         /\/d\/([a-zA-Z0-9_-]+)/,
//         /id=([a-zA-Z0-9_-]+)/,
//         /file\/d\/([a-zA-Z0-9_-]+)/
//     ];
//     for (const pattern of patterns) {
//         const match = url.match(pattern);
//         if (match) return match[1];
//     }
//     return null;
// }

// // ============================================
// // FUNÇÃO PARA GERAR URL DE IMAGEM DO DRIVE
// // ============================================
// function getDriveImageUrl(url, size = 100) {
//     if (!url) return null;
//     if (url.includes('googleusercontent.com')) return url;
    
//     const fileId = getDriveImageId(url);
//     if (fileId) {
//         return `https://lh3.googleusercontent.com/u/0/d/${fileId}=w${size}`;
//     }
    
//     if (url.startsWith('http')) return url;
//     return null;
// }

// // ============================================
// // FUNÇÃO PARA IMAGEM PLACEHOLDER (NUNCA USA via.placeholder.com)
// // ============================================
// function getPlaceholderImage(imagem, size = 100) {
//     if (!imagem || imagem === '' || imagem === 'placeholder.png' || imagem === 'Sem imagem') {
//         return SVG_PLACEHOLDER_100;
//     }
    
//     const driveUrl = getDriveImageUrl(imagem, size);
//     if (driveUrl) return driveUrl;
    
//     if (imagem.startsWith('http')) return imagem;
    
//     return SVG_PLACEHOLDER_100;
// }

// // ============================================
// // VARIÁVEIS GLOBAIS
// // ============================================
// let produtos = [];
// let banners = [];
// let dataTableInstance;
// let categoriasCache = [];

// // ============================================
// // FUNÇÃO PARA PARSEAR CSV
// // ============================================
// function parseCSV(text) {
//     const lines = [];
//     let currentLine = [];
//     let currentField = '';
//     let insideQuotes = false;
    
//     for (let i = 0; i < text.length; i++) {
//         const char = text[i];
//         const nextChar = text[i + 1];
        
//         if (char === '"') {
//             if (insideQuotes && nextChar === '"') {
//                 currentField += '"';
//                 i++;
//             } else {
//                 insideQuotes = !insideQuotes;
//             }
//         } else if (char === ',' && !insideQuotes) {
//             currentLine.push(currentField.trim());
//             currentField = '';
//         } else if (char === '\n' || char === '\r') {
//             if (char === '\r' && nextChar === '\n') {
//                 i++;
//             }
//             currentLine.push(currentField.trim());
//             if (currentLine.some(field => field !== '')) {
//                 lines.push(currentLine);
//             }
//             currentLine = [];
//             currentField = '';
//         } else {
//             currentField += char;
//         }
//     }
    
//     if (currentField || currentLine.length > 0) {
//         currentLine.push(currentField.trim());
//         if (currentLine.some(field => field !== '')) {
//             lines.push(currentLine);
//         }
//     }
//     return lines;
// }

// // ============================================
// // FUNÇÃO PARA CHAMAR A API
// // ============================================
// async function chamarAPI(tipo, dados) {
//     try {
//         const response = await fetch(API_WRITE_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ tipo, ...dados })
//         });
//         const result = await response.json();
//         return result;
//     } catch (error) {
//         console.error("Erro na API:", error);
//         alert("❌ Erro ao comunicar com a API. Verifique a conexão.");
//         return { success: false, error: error.message };
//     }
// }

// // ============================================
// // CARREGAR CATEGORIAS
// // ============================================
// async function carregarCategorias() {
//     try {
//         const responseC = await fetch(CATEGORIAS_CSV_URL);
//         if (!responseC.ok) throw new Error(`HTTP ${responseC.status}`);
        
//         const dataC = await responseC.text();
//         const rowsC = parseCSV(dataC);
        
//         const select = document.getElementById('Categoria');
//         if (!select) return;
        
//         select.innerHTML = '<option value="">Selecione uma categoria</option>';
//         categoriasCache = [];
        
//         if (rowsC.length > 1) {
//             rowsC.slice(1).forEach(row => {
//                 if (row[1] && row[1].trim() !== '') {
//                     const option = document.createElement('option');
//                     option.value = row[1].trim();
//                     option.textContent = row[1].trim();
//                     select.appendChild(option);
//                     categoriasCache.push(row[1].trim());
//                 }
//             });
//         }
        
//         if (categoriasCache.length === 0) {
//             const categoriasPadrao = [
//                 "Brincos de Pressão", "Argolas Douradas", "Argolas Prateadas",
//                 "Pingentes Dourados", "Pingentes Prateados", "Brincos de Moda Dourado",
//                 "Brincos de Moda Prateados", "Anéis", "Correntes", "Pulseiras",
//                 "Colares", "Gargantilhas", "Braceletes", "Terço", "Escapulários"
//             ];
//             categoriasPadrao.forEach(cat => {
//                 const option = document.createElement('option');
//                 option.value = cat;
//                 option.textContent = cat;
//                 select.appendChild(option);
//                 categoriasCache.push(cat);
//             });
//         }
//     } catch (error) {
//         console.error("Erro ao carregar categorias:", error);
//         const select = document.getElementById('Categoria');
//         if (select) {
//             const categoriasPadrao = [
//                 "Brincos de Pressão", "Argolas Douradas", "Argolas Prateadas",
//                 "Pingentes Dourados", "Pingentes Prateados", "Brincos de Moda Dourado",
//                 "Brincos de Moda Prateados", "Anéis", "Correntes", "Pulseiras",
//                 "Colares", "Gargantilhas", "Braceletes", "Terço", "Escapulários"
//             ];
//             select.innerHTML = '<option value="">Selecione uma categoria</option>';
//             categoriasPadrao.forEach(cat => {
//                 const option = document.createElement('option');
//                 option.value = cat;
//                 option.textContent = cat;
//                 select.appendChild(option);
//             });
//         }
//     }
// }

// // ============================================
// // CARREGAR PRODUTOS
// // ============================================
// async function carregarProdutos() {
//     try {
//         const responseP = await fetch(PRODUCTS_CSV_URL);
//         if (!responseP.ok) throw new Error(`HTTP ${responseP.status}`);
        
//         const dataP = await responseP.text();
//         const rowsP = parseCSV(dataP);
        
//         if (rowsP.length < 2) {
//             console.error("Nenhum produto encontrado");
//             return;
//         }

//         const headersP = rowsP[0].map(h => h.replace(/"/g, '').trim());
//         const idx = {
//             ID: headersP.indexOf("ID"),
//             Nome: headersP.indexOf("Nome do Produto"),
//             Referencia: headersP.indexOf("referencia"),
//             Preco: headersP.indexOf("Preço"),
//             Categoria: headersP.indexOf("Categoria"),
//             Cores: headersP.indexOf("Cores"),
//             Quantidade: headersP.indexOf("Quantidade"),
//             Imagem: headersP.indexOf("Imagem"),
//             Estoque: headersP.indexOf("Saldo Estoque") !== -1 ? headersP.indexOf("Saldo Estoque") : headersP.indexOf("Estoque"),
//             Disponivel: headersP.indexOf("Disponível"),
//             Destaque: headersP.indexOf("Destaque")
//         };

//         produtos = rowsP.slice(1)
//             .filter(row => row.length > 1 && row[idx.Nome] && row[idx.Nome].trim() !== '')
//             .map(row => ({
//                 ID: row[idx.ID] || '',
//                 "Nome do Produto": row[idx.Nome] || 'Sem nome',
//                 referencia: row[idx.Referencia] || '',
//                 Preço: parseFloat(String(row[idx.Preco] || '0').replace(',', '.')) || 0,
//                 Categoria: row[idx.Categoria] || '',
//                 Cores: row[idx.Cores] || '',
//                 Quantidade: row[idx.Quantidade] || '',
//                 Imagem: row[idx.Imagem] || '',
//                 "Saldo Estoque": parseInt(row[idx.Estoque]) || 0,
//                 Disponível: (row[idx.Disponivel] || 'sim').toLowerCase() === 'sim' ? 'sim' : 'nao',
//                 Destaque: (row[idx.Destaque] || 'nao').toLowerCase() === 'sim' ? 'sim' : 'nao'
//             }));

//         // Carregar Banners
//         try {
//             const responseB = await fetch(BANNERS_CSV_URL);
//             if (responseB.ok) {
//                 const dataB = await responseB.text();
//                 const rowsB = parseCSV(dataB);
//                 if (rowsB.length > 1) {
//                     banners = rowsB.slice(1)
//                         .filter(row => row.length > 1 && row[1] && row[1].trim() !== '')
//                         .map(row => ({
//                             imagem: row[0] || '',
//                             titulo: row[1] || '',
//                             btnText: row[2] || '',
//                             btnLink: row[3] || '',
//                             ativo: (row[4] || 'sim').toLowerCase() === 'sim' ? 'sim' : 'nao'
//                         }));
//                 }
//             }
//         } catch (err) {
//             console.warn("Erro ao carregar banners:", err);
//         }

//         // Atualizar cards
//         document.getElementById('total-produtos').innerText = produtos.length;
//         document.getElementById('total-estoque').innerText = produtos.reduce((s, p) => s + p["Saldo Estoque"], 0);
//         document.getElementById('estoque-baixo').innerText = produtos.filter(p => p["Saldo Estoque"] <= 3 && p["Saldo Estoque"] > 0).length;
//         document.getElementById('total-destaques').innerText = produtos.filter(p => p.Destaque === 'sim').length;

//         renderizarTabela();
//         renderizarBanners();
//         await carregarCategorias();
        
//     } catch (error) {
//         console.error("Erro ao carregar produtos:", error);
//         alert("❌ Erro ao carregar produtos.\n\n" + error.message);
//     }
// }

// // ============================================
// // RENDERIZAR TABELA (SEM via.placeholder.com)
// // ============================================
// function renderizarTabela() {
//     const tbody = document.getElementById("produtos-tbody");
//     tbody.innerHTML = "";

//     if (produtos.length === 0) {
//         tbody.innerHTML = `
//             <tr>
//                 <td colspan="10" class="text-center py-8 text-gray-400">
//                     <i class="fas fa-box-open text-2xl mb-2 block"></i>
//                     Nenhum produto encontrado.
//                 </td>
//             </tr>
//         `;
//         return;
//     }

//     produtos.forEach(p => {
//         const estoque = parseInt(p["Saldo Estoque"]) || 0;
//         const status = estoque <= 0 ? 'bg-red-100 text-red-700' : (estoque <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700');
//         const imgSrc = getPlaceholderImage(p.Imagem, 100);
        
//         const tr = document.createElement("tr");
//         tr.innerHTML = `
//             <td class="font-bold">${p.ID}</td>
//             <td>
//                 <img src="${imgSrc}" 
//                      class="w-10 h-10 rounded object-cover" 
//                      alt="${p["Nome do Produto"]}"
//                      onerror="this.src='${SVG_PLACEHOLDER_100}'">
//             </td>
//             <td class="font-medium">${p["Nome do Produto"]}</td>
//             <td>${p.referencia}</td>
//             <td class="font-bold text-primary">R$ ${parseFloat(p.Preço || 0).toFixed(2).replace(".", ",")}</td>
//             <td><span class="bg-gray-100 px-2 py-1 rounded text-xs font-bold">${p.Categoria}</span></td>
//             <td><span class="badge-estoque ${status}">${estoque}</span></td>
//             <td class="text-center">${p.Disponível === 'sim' ? '<i class="fas fa-check-circle text-green-500"></i>' : '<i class="fas fa-times-circle text-red-400"></i>'}</td>
//             <td class="text-center">${p.Destaque === 'sim' ? '<i class="fas fa-star text-yellow-500"></i>' : ''}</td>
//             <td class="flex gap-2">
//                 <button onclick="editarProduto('${p.ID}')" class="text-blue-600 hover:text-blue-800 p-1 rounded"><i class="fas fa-pen"></i></button>
//                 <button onclick="excluirProduto('${p.ID}')" class="text-red-500 hover:text-red-700 p-1 rounded"><i class="fas fa-trash-alt"></i></button>
//             </td>
//         `;
//         tbody.appendChild(tr);
//     });

//     if ($.fn.DataTable.isDataTable('#produtosTable')) {
//         $('#produtosTable').DataTable().clear().destroy();
//     }
//     dataTableInstance = $('#produtosTable').DataTable({
//         responsive: true,
//         pageLength: 25,
//         order: [[0, 'asc']],
//         language: { url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' }
//     });
// }

// // ============================================
// // RENDERIZAR BANNERS (SEM via.placeholder.com)
// // ============================================
// function renderizarBanners() {
//     const container = document.getElementById("banners-list");
//     container.innerHTML = "";
    
//     if (!banners || banners.length === 0) {
//         container.innerHTML = '<p class="text-gray-400 text-center py-4">Nenhum banner cadastrado.</p>';
//         return;
//     }

//     banners.forEach((b, index) => {
//         const imgSrc = getPlaceholderImage(b.imagem, 100);
//         const div = document.createElement("div");
//         div.className = "flex items-center justify-between bg-gray-50 p-3 rounded-lg border";
//         div.innerHTML = `
//             <div class="flex items-center gap-3">
//                 <img src="${imgSrc}" 
//                      class="w-12 h-12 rounded object-cover" 
//                      alt="${b.titulo}"
//                      onerror="this.src='${SVG_PLACEHOLDER_100}'">
//                 <div>
//                     <p class="font-bold text-sm">${b.titulo}</p>
//                     <p class="text-xs text-gray-500">${b.btnText} - ${b.ativo === 'sim' ? '✅ Ativo' : '❌ Inativo'}</p>
//                 </div>
//             </div>
//             <button onclick="excluirBanner(${index})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
//         `;
//         container.appendChild(div);
//     });
// }

// // ============================================
// // MODAIS
// // ============================================
// function abrirModal(tipo) {
//     if (tipo === 'modalProduto') {
//         document.getElementById('modalProdutoTitle').innerText = "Adicionar Produto";
//         document.getElementById('formProduto').reset();
//         document.getElementById('editID').value = "";
//         document.getElementById('ID').value = "";
//         document.getElementById('Disponível').checked = true;
//         document.getElementById('Destaque').checked = false;
//         document.getElementById('Saldo Estoque').value = 0;
//         carregarCategorias();
//         document.getElementById('modalProduto').classList.add('active');
//     } else {
//         document.getElementById('modalBanner').classList.add('active');
//         renderizarBanners();
//     }
// }

// function fecharModal(id) {
//     document.getElementById(id).classList.remove('active');
// }

// // ============================================
// // ADICIONAR CATEGORIA
// // ============================================
// document.getElementById('btnNovaCategoria').addEventListener('click', async function() {
//     const input = document.getElementById('novaCategoria');
//     const nome = input.value.trim();
    
//     if (!nome) {
//         alert('Digite o nome da nova categoria');
//         return;
//     }
    
//     if (categoriasCache.includes(nome)) {
//         alert('Esta categoria já existe!');
//         input.value = '';
//         return;
//     }
    
//     try {
//         const result = await chamarAPI('salvar_categoria', {
//             categoria: { nome: nome, ativo: 'sim' }
//         });
        
//         if (result.success) {
//             const select = document.getElementById('Categoria');
//             const option = document.createElement('option');
//             option.value = nome;
//             option.textContent = nome;
//             select.appendChild(option);
//             select.value = nome;
//             categoriasCache.push(nome);
//             input.value = '';
//             alert('✅ Categoria adicionada com sucesso!');
//         } else {
//             alert('❌ Erro: ' + (result.error || 'Erro desconhecido'));
//         }
//     } catch (error) {
//         console.error('Erro ao salvar categoria:', error);
//         alert('❌ Erro ao salvar categoria.');
//     }
// });

// document.getElementById('novaCategoria').addEventListener('keypress', function(e) {
//     if (e.key === 'Enter') {
//         e.preventDefault();
//         document.getElementById('btnNovaCategoria').click();
//     }
// });

// // ============================================
// // SALVAR PRODUTO
// // ============================================
// document.getElementById('formProduto').onsubmit = async (e) => {
//     e.preventDefault();
    
//     const idEdicao = document.getElementById('editID').value;
//     const nome = document.getElementById('Nome do Produto').value.trim();
//     const referencia = document.getElementById('referencia').value.trim();
//     const preco = document.getElementById('Preço').value.replace(',', '.');
//     const quantidade = document.getElementById('Quantidade').value.trim();
//     const categoria = document.getElementById('Categoria').value;
//     const cores = document.getElementById('Cores').value.trim();
//     const tamanho = document.getElementById('Tamanho').value.trim();
//     const imagem = document.getElementById('Imagem').value.trim();
//     const disponivel = document.getElementById('Disponível').checked ? 'sim' : 'nao';
//     const destaque = document.getElementById('Destaque').checked ? 'sim' : 'nao';
//     const estoque = parseInt(document.getElementById('Saldo Estoque').value) || 0;
    
//     if (!nome) {
//         alert('Preencha o Nome do Produto');
//         return;
//     }
//     if (!categoria) {
//         alert('Selecione ou adicione uma Categoria');
//         return;
//     }
//     if (!preco || parseFloat(preco) <= 0) {
//         alert('Preencha um Preço válido');
//         return;
//     }
    
//     const dados = {
//         ID: idEdicao || '',
//         "Nome do Produto": nome,
//         referencia: referencia,
//         Preço: parseFloat(preco) || 0,
//         Quantidade: quantidade,
//         Categoria: categoria,
//         Cores: cores,
//         Tamanho: tamanho,
//         Imagem: imagem,
//         Disponível: disponivel,
//         Destaque: destaque,
//         "Saldo Estoque": estoque
//     };
    
//     const tipo = idEdicao ? "atualizar" : "cadastrar";
    
//     const btnSubmit = document.querySelector('#formProduto button[type="submit"]');
//     const textoOriginal = btnSubmit.innerHTML;
//     btnSubmit.disabled = true;
//     btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
    
//     try {
//         const result = await chamarAPI(tipo, { produto: dados });
        
//         if (result.success) {
//             alert(result.message || 'Produto salvo com sucesso!');
//             if (!idEdicao) {
//                 document.getElementById('formProduto').reset();
//                 document.getElementById('ID').value = '';
//                 document.getElementById('Disponível').checked = true;
//                 document.getElementById('Saldo Estoque').value = 0;
//             }
//             fecharModal('modalProduto');
//             setTimeout(() => carregarProdutos(), 1500);
//         } else {
//             alert('❌ Erro: ' + (result.error || 'Erro desconhecido'));
//         }
//     } catch (error) {
//         console.error("Erro ao salvar:", error);
//         alert('❌ Erro ao salvar produto: ' + error.message);
//     } finally {
//         btnSubmit.disabled = false;
//         btnSubmit.innerHTML = textoOriginal;
//     }
// };

// // ============================================
// // EDITAR PRODUTO
// // ============================================
// function editarProduto(id) {
//     const p = produtos.find(prod => prod.ID === id);
//     if (!p) return;

//     document.getElementById('modalProdutoTitle').innerText = "Editar Produto";
//     document.getElementById('editID').value = p.ID;
//     document.getElementById('ID').value = p.ID;
//     document.getElementById('Nome do Produto').value = p["Nome do Produto"];
//     document.getElementById('referencia').value = p.referencia || '';
//     document.getElementById('Preço').value = p.Preço;
//     document.getElementById('Quantidade').value = p.Quantidade || '';
    
//     const select = document.getElementById('Categoria');
//     if (p.Categoria) {
//         select.value = p.Categoria;
//         if (!select.value) {
//             const option = document.createElement('option');
//             option.value = p.Categoria;
//             option.textContent = p.Categoria;
//             select.appendChild(option);
//             select.value = p.Categoria;
//         }
//     }
    
//     document.getElementById('Cores').value = p.Cores || '';
//     document.getElementById('Tamanho').value = p.Tamanho || '';
//     document.getElementById('Imagem').value = p.Imagem || '';
//     document.getElementById('Saldo Estoque').value = p["Saldo Estoque"] || 0;
//     document.getElementById('Disponível').checked = p.Disponível === 'sim';
//     document.getElementById('Destaque').checked = p.Destaque === 'sim';

//     document.getElementById('modalProduto').classList.add('active');
// }

// // ============================================
// // EXCLUIR PRODUTO
// // ============================================
// async function excluirProduto(id) {
//     if (confirm(`Tem certeza que deseja excluir o produto ID ${id}?`)) {
//         const result = await chamarAPI("excluir", { id: id });
//         if (result.success) {
//             alert('Produto excluído com sucesso!');
//             setTimeout(() => carregarProdutos(), 1500);
//         } else {
//             alert('❌ Erro: ' + (result.error || 'Erro desconhecido'));
//         }
//     }
// }

// // ============================================
// // BANNERS
// // ============================================
// document.getElementById('formBanner').onsubmit = async (e) => {
//     e.preventDefault();
    
//     const banner = {
//         imagem: document.getElementById('bannerImagem').value.trim(),
//         titulo: document.getElementById('bannerTitulo').value.trim(),
//         btnText: document.getElementById('bannerBtnText').value.trim(),
//         btnLink: document.getElementById('bannerBtnLink').value.trim(),
//         ativo: document.getElementById('bannerAtivo').checked ? 'sim' : 'nao'
//     };
    
//     if (!banner.imagem || !banner.titulo) {
//         alert('Preencha a imagem e o título do banner');
//         return;
//     }

//     const result = await chamarAPI("salvar_banner", { banner: banner, index: null });
//     if (result.success) {
//         alert('Banner adicionado com sucesso!');
//         document.getElementById('formBanner').reset();
//         document.getElementById('bannerAtivo').checked = true;
//         setTimeout(() => carregarProdutos(), 1500);
//     } else {
//         alert('❌ Erro: ' + (result.error || 'Erro desconhecido'));
//     }
// };

// async function excluirBanner(index) {
//     if (confirm("Tem certeza que deseja excluir este banner?")) {
//         const result = await chamarAPI("excluir_banner", { index: index });
//         if (result.success) {
//             alert('Banner excluído com sucesso!');
//             setTimeout(() => carregarProdutos(), 1500);
//         } else {
//             alert('❌ Erro: ' + (result.error || 'Erro desconhecido'));
//         }
//     }
// }

// // ============================================
// // FECHAR MODAL COM ESC
// // ============================================
// document.addEventListener('keydown', function(e) {
//     if (e.key === 'Escape') {
//         document.querySelectorAll('.modal-overlay.active').forEach(modal => {
//             modal.classList.remove('active');
//         });
//     }
// });

// // ============================================
// // INICIALIZAÇÃO
// // ============================================
// document.addEventListener('DOMContentLoaded', function() {
//     console.log("🚀 Inicializando Admin...");
//     carregarProdutos();
// });