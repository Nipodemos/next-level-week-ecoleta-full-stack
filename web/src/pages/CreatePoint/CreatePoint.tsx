import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import './styles.css'
import logo from '../../assets/logo.svg'
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'
import Dropzone from '../../components/DropZone/DropZone'
import api from '../../services/api';
import axios from 'axios'

interface Item {
  id: number,
  title: string,
  image_url: string
}

interface IBGEufResponse {
  sigla: string
}

interface IBGEcityResponse {
  nome: string
}

const CreatePoint = () => {
  // array ou objeto: necessário informar manualmente o tipo da variável
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [selectedUf, setSelectedUf] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])
  const [selectedFile, setSelectedFile] = useState<File>()
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])
  const [selectItems, setSelectedItems] = useState<number[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  })

  const history = useHistory();
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      setInitialPosition([
        latitude,
        longitude
      ])
    })
  }, [])

  // pega a imagem e o título dos items a serem exibidos na tela
  useEffect(() => {
    api.get('items').then((response) => {
      setItems(response.data)
    })
  }, [])

  // pega todos os estados da api do IBGE
  useEffect(() => {
    axios
      .get<IBGEufResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then((response) => {
        const ufInitials = response.data.map((uf) => uf.sigla)
        console.log(ufInitials);
        setUfs(ufInitials)
      })
  }, [])

  // após um estado ser selecionado pelo usuário, procura todas as cidades do mesmo
  useEffect(() => {
    if (selectedUf === '') return;
    axios
      .get<IBGEcityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then((response) => {
        const citieNames = response.data.map((city) => city.nome)

        setCities(citieNames)
      })
  }, [selectedUf])


  // serve para quando o usuário selecionar o estado, salvar esse valor selecionado
  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUf(uf)
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city)
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng
    ])
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    const value = event.target.value;
    setFormData({ ...formData, [name]: value })
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectItems.findIndex((item) => { return item === id })

    if (alreadySelected >= 0) {
      const filteredItems = selectItems.filter((item) => { return item !== id })
      setSelectedItems(filteredItems)
    } else {
      setSelectedItems([...selectItems, id])
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectItems;

    const data = new FormData();

    data.append('name', name);
    data.append('email', email);
    data.append('whatsapp', whatsapp);
    data.append('uf', uf);
    data.append('city', city);
    data.append('latitude', String(latitude));
    data.append('longitude', String(longitude));
    data.append('items', items.join(','));

    if (selectedFile) {
      data.append('image', selectedFile)

    }

    await api.post('points', data)
    alert('ponto de coleta criado')
    history.push('/')
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Logo Ecoleta" />
        <Link to="/" >
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br /> ponto de coleta</h1>

        <Dropzone onFileUploaded={setSelectedFile} />


        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input onChange={handleInputChange} type="text" name="name" id="name" />
          </div>

          <div className="field-group">

            <div className="field">
              <label htmlFor="email">Email</label>
              <input onChange={handleInputChange} type="email" name="email" id="email" />
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input onChange={handleInputChange} type="text" name="whatsapp" id="whatsapp" />
            </div>

          </div>

        </fieldset>

        <fieldset>

          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>
          <div className="field-group">

            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>

              <select
                value={selectedUf}
                onChange={handleSelectUf}
                name="uf"
                id="uf"
              >
                <option value="0">Selecione uma UF</option>
                {
                  ufs.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))
                }
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>

              <select
                value={selectedCity}
                onChange={handleSelectCity}
                name="city"
                id="city"
              >
                <option value="0">Selecione uma cidade</option>
                {
                  cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))
                }
              </select>
            </div>

          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={selectItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">Cadastrar ponto de coleta</button>
      </form >

    </div >
  );
}

export default CreatePoint;