import React, { Component } from 'react';
import items from './data';
import Client from './Contentful';

const RoomContext = React.createContext();

export default class RoomProvider extends Component {
    state = {
        rooms: [],
        sortedRooms: [],
        featuredRooms: [],
        loading: true,
        type: 'all',
        capacity: 1,
        price: 0,
        minPrice: 0,
        maxPrice: 0,
        minSize: 0,
        maxSize: 0,
        breakfast: false,
        pets: false
    };

    getData = async () => {
        try {
            // Contentful로부터 자료를 얻어온다.
            let response = await Client.getEntries({ content_type: 'beachResortRoom', order: 'sys.createdAt' });
            let rooms = this.formatData(response.items);
            // local로부터 자료를 얻어온 다음 인터네트로부터 얻어온 자료배렬과 련결.
            rooms = [...this.formatData(items), ...rooms];
            let featuredRooms = rooms.filter(room => room.featured === true);
            let maxPrice = Math.max(...rooms.map(item => item.price));
            let maxSize = Math.max(...rooms.map(item => item.size));
            this.setState({
                rooms,
                sortedRooms: rooms,
                featuredRooms,
                loading: false,
                price: maxPrice,
                maxPrice,
                maxSize
            });
        } catch (err) {

        }
    }

    componentDidMount() {
        this.getData();
    }

    formatData(items) {
        let tempItems = items.map(item => {
            let id = item.sys.id;
            let images = item.fields.images.map(image => image.fields.file.url);
            let room = { ...item.fields, images, id };
            return room;
        });
        return tempItems;
    }

    getRoom = (slug) => {
        let tempRooms = [...this.state.rooms];
        const room = tempRooms.find(room => room.slug === slug);
        return room;
    }

    handleChange = event => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = event.target.name;
        this.setState({
            [name]: value
        }, this.filterRooms);
    }

    filterRooms = () => {
        let { rooms, type, capacity, price, minSize, maxSize, breakfast, pets } = this.state;

        // 모든 방얻기
        let tempRooms = [...rooms];

        // RoomFilter에서 선택한 사용자의 방려과파라메터변환
        capacity = parseInt(capacity);
        price = parseInt(price);

        // RoomFilter에서 선택한 사용자의 선택에 따라 방려과 및 setState
        if (type !== 'all') {
            tempRooms = tempRooms.filter(room => room.type === type);
        }
        if (capacity !== 1) {
            tempRooms = tempRooms.filter(room => room.capacity >= capacity);
        }
        tempRooms = tempRooms.filter(room => room.price <= price);
        tempRooms = tempRooms.filter(room => room.size >= minSize && room.size <= maxSize);
        if (breakfast) {
            tempRooms = tempRooms.filter(room => room.breakfast === true);
        }
        if (pets) {
            tempRooms = tempRooms.filter(room => room.pets === true);
        }
        this.setState({ sortedRooms: tempRooms });
    }

    render() {
        return <RoomContext.Provider value={{ ...this.state, getRoom: this.getRoom, handleChange: this.handleChange }}>
            {this.props.children}
        </RoomContext.Provider>;
    }
}

const RoomConsumer = RoomContext.Consumer;

export function withRoomConsumer(Component) {
    return function ConsumerWrapper(props) {
        return <RoomConsumer>
            {value => <Component {...props} context={value} />}
        </RoomConsumer>
    }
}

export { RoomProvider, RoomConsumer, RoomContext };