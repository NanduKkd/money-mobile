import React, { useEffect, useState } from 'react'
import { ScrollView, Button, View, Text, Image, StyleSheet, Modal, TouchableOpacity, useColorScheme, FlatList, TextInput, Alert, SectionList } from 'react-native'
import { formatMoney } from './src/utils/money'
import { Picker } from '@react-native-picker/picker'
import DateTimePicker from '@react-native-community/datetimepicker'

type transactionBasic = {
	amount: number,
	comment: string,
	date: Date,
}
type realTransaction = transactionBasic & {
	type: 'transaction',
	category: string,
	account: string,
}
type selfTransaction = transactionBasic & {
	type: 'self',
	fromaccount: string,
	toaccount: string,
}
type rollTransaction = transactionBasic & {
	type: 'roll',
	rollperson: string,
	account: string,
}
type Transaction = realTransaction | selfTransaction | rollTransaction;
type StructureItem = {name: string, _id: string}[];

function TransactionItem(props: {category: string, account: string, amount: number}) {
	const colorScheme = useColorScheme()
	const styles = colorScheme==='dark'?darkStyles:lightStyles
	const amount = formatMoney(props.amount)
	return (
		<View style={[styles.ListItem, styles.TransactionItem]}>
			<View style={{flexDirection: 'row'}}>
				<Text style={[styles.ListItemTitle, {flex: 1}]}>{props.category}</Text>
				<Text style={[styles.ListItemAmount, props.amount>0?styles.SuccessText:styles.WarningText]}>₹{amount}</Text>
			</View>
			<Text style={styles.ListItemSubtitle}>{props.account}</Text>
		</View>
	)
}

function RollItem(props: {person: string, account: string, amount: number}) {
	const colorScheme = useColorScheme()
	const styles = colorScheme==='dark'?darkStyles:lightStyles
	const amount = formatMoney(props.amount)
	return (
		<View style={[styles.ListItem, styles.RollItem]}>
			<View style={{flexDirection: 'row'}}>
				<Text style={[styles.ListItemTitle, {flex: 1}]}>Rolled</Text>
				<Text style={[styles.ListItemAmount, props.amount>0?styles.SuccessText:styles.WarningText]}>₹{amount}</Text>
			</View>
			<View style={{flexDirection: 'row'}}>
				<Text style={[styles.ListItemSubtitle, {flex: 1, marginRight: 10}]}>{props.account}</Text>
				<Text style={styles.ListItemSubtitle}>{props.person.length>15?props.person.substring(0, 12)+'...':props.person}</Text>
			</View>
		</View>
	)
}

function SelfTransferItem(props: {fromaccount: string, toaccount: string, amount: number}) {
	const colorScheme = useColorScheme()
	const styles = colorScheme==='dark'?darkStyles:lightStyles
	const amount = formatMoney(props.amount)
	return (
		<View style={[styles.ListItem, styles.SelfTransferItem]}>
			<Text style={[styles.ListItemSubtitle, {flex: 1}]}>{props.fromaccount}</Text>
			<Text style={[styles.ListItemSubtitle, {marginHorizontal: 10}]}>{'→'}</Text>
			<Text style={[styles.ListItemSubtitle, {flex: 1}]}>{props.toaccount}</Text>
			<Text style={[styles.ListItemAmount, styles.ListItemSubtitle, props.amount>0?styles.SuccessText:styles.WarningText]}>₹{amount}</Text>
		</View>
	);
}

export default function MoneyApp() {
	const colorScheme = useColorScheme()
	const styles = colorScheme==='dark'?darkStyles:lightStyles
	const [data, setData] = useState<{_id: '', total: number, data: Transaction[]}[]>([]);
	const [showForm, setShowForm] = useState(false)
	const [loading, setLoading] = useState(false)
	useEffect(() => {
		loadData();
	}, [])
	function loadData() {
		setLoading(true);
		fetch('http://192.168.39.69:3001/api/transactions')
			.then(res => {
				return res.json()
			})
			.then(res => {
				setData(res)
				setLoading(false);
			})
			.catch(e => {
				setLoading(false)
				Alert.alert("Error", "Could not load transactions..")
				console.log("Transaction load error: "+e.message)
			})
	}
	return (
		<View style={styles.Outer}>
			<View style={styles.Header}>
				<View style={{flex: 1}} />
				<TouchableOpacity style={styles.HeaderButton}>
					<Image style={styles.HeaderIcon} source={require('./src/assets/filter.png')} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setShowForm(true)} style={styles.HeaderButton}>
					{showForm?null:<Image style={styles.HeaderIcon} source={require('./src/assets/add.png')} />}
				</TouchableOpacity>
			</View>
			<SectionList
				sections={data}
				refreshing={loading}
				keyExtractor={(i,ii) => ii+'_'}
				onRefresh={() => loadData()}
				renderSectionHeader={({section}) => (
					<View style={styles.SectionHeader}>
						<Text style={[styles.SectionTitle, {flex: 1}]}>{section._id}</Text>
						<Text style={[styles.SectionTitle, section.total<0?styles.WarningText:styles.SuccessText]}>₹{formatMoney(section.total)}</Text>
					</View>
				)}
				renderItem={({item, index}) => (
					// <Text style={{color: 'red'}}>{item.type}</Text>
					item.type==='transaction'?<TransactionItem category={item.category} account={item.account} amount={item.amount} />
					:item.type==='self'?<SelfTransferItem fromaccount={item.fromaccount} toaccount={item.toaccount} amount={item.amount} />
					:item.type==='roll'?<RollItem person={item.rollperson} account={item.account} amount={item.amount} />
					:null
				)}
			/>
			<Modal animationType='slide' visible={showForm} onRequestClose={() => setShowForm(false)}>
				<AddForm onClose={() => setShowForm(false)} />
			</Modal>
		</View>
	)
}

function AddForm (props: {onClose: () => void}) {
	const colorScheme = useColorScheme()
	const styles = colorScheme==='dark'?darkStyles:lightStyles;

	const [structure, setStructure] = useState<{
		categories: StructureItem,
		accounts: StructureItem,
		people: StructureItem,
	}>({categories: [], accounts: [], people: []})

	const [comment, setComment] = useState<string>('')
	const [date, setDate] = useState<Date | undefined>(new Date())
	const [amount, setAmount] = useState<string>("")
	const [type, setType] = useState<"" | "transaction" | "roll" | "self">("")
	const [category, setCategory] = useState<string>("")
	const [account, setAccount] = useState<string>("")
	const [fromaccount, setFromaccount] = useState<string>("")
	const [toaccount, setToaccount] = useState<string>("")
	const [rollperson, setRollperson] = useState<string>("")
	const [loading, setLoading] = useState<boolean>(false);

	const validated = date && amount && parseFloat(amount)+''===amount && type && (
		type==="transaction"
			?category && account
			:type==="roll"
				?rollperson && account
				:fromaccount && toaccount
	)
	useEffect(() => {
		setLoading(true);
		fetch('http://192.168.39.69:3001/api/structure/')
			.then(res => {
				if(res.status===200) return res.json();
				else throw new Error();
			})
			.then(res => {
				setLoading(false)
				setStructure(res);
			})
			.catch(e => {
				console.log("Structure data load error: "+e.message)
				Alert.alert("Error", "Error loading form data")
			})
	}, [])

	function submitForm() {
		if(!validated) return;
		setLoading(true)
		let body: Transaction;
		if(type==='transaction') {
			body = {date, amount: parseFloat(amount), type, comment, category, account};
		} else if(type==='roll') {
			body = {date, amount: parseFloat(amount), type, comment, rollperson, account};
		} else {
			body = {date, amount: parseFloat(amount), type, comment, fromaccount, toaccount};
		}
		fetch("http://192.168.39.69:3001/api/transactions", {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(body),
		})
			.then(res => {
				if(res.status!==200) throw new Error("HTTP Status "+res.status)
				else {
					setLoading(false)
					setDate(new Date())
					setAmount('')
					setAccount('')
					setType('')
					setCategory('')
					setRollperson('')
					setToaccount('')
					setFromaccount('')
					setComment('')
					props.onClose();
				}
			})
			.catch(e => {
				Alert.alert("Error", "Could not save transaction")
				console.log("Transaction save error: "+e.message)
			})
			.then(() => {
				setLoading(false);
			})
	}
	return (
		<View style={[styles.FormOuter]}>
			<View style={styles.Header}>
				<TouchableOpacity onPress={props.onClose} style={styles.HeaderButton}>
					<Image style={styles.HeaderIcon} source={require('./src/assets/back.png')} />
				</TouchableOpacity>
			</View>
			<ScrollView style={styles.FormInner}>
				<Text style={styles.Label}>Type</Text>
				<View style={styles.InputOuter}><Picker
					style={styles.Picker}
					enabled={!loading}
					selectedValue={type}
					onValueChange={(val) => setType(val)}
					dropdownIconColor={colorScheme==="light"?"#000":"#fff"}
				>
					<Picker.Item label="--Select--" value="" />
					<Picker.Item label="Transaction" value="transaction" />
					<Picker.Item label="Rolling" value="roll" />
					<Picker.Item label="Self Transfer" value="self" />
				</Picker></View>
				<Text style={styles.Label}>Amount</Text>
				<TextInput editable={!loading} style={[styles.InputOuter, styles.Input]} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder='0.00' placeholderTextColor={colorScheme==="light"?"#777":"#666"} />
				{type==="transaction"?<>
				<Text style={styles.Label}>Category</Text>
				<View style={styles.InputOuter}><Picker
					style={styles.Picker}
					selectedValue={category}
					enabled={!loading}
					onValueChange={setCategory}
					dropdownIconColor={colorScheme==="light"?"#000":"#fff"}
				>
					<Picker.Item label="--Select--" value="" />
					{structure.categories.map((i, ii) => (
						<Picker.Item label={i.name} value={i._id} key={ii} />
					))}
				</Picker></View>
				</>:null}
				{type==="roll"?<>
				<Text style={styles.Label}>Person</Text>
				<View style={styles.InputOuter}><Picker
					style={styles.Picker}
					enabled={!loading}
					selectedValue={rollperson}
					onValueChange={setRollperson}
					dropdownIconColor={colorScheme==="light"?"#000":"#fff"}
				>
					<Picker.Item label="--Select--" value="" />
					{structure.people.map((i, ii) => (
						<Picker.Item label={i.name} value={i._id} key={ii} />
					))}
				</Picker></View>
				</>:null}
				{type==="transaction" || type==="roll"?<>
				<Text style={styles.Label}>Account</Text>
				<View style={styles.InputOuter}><Picker
					style={styles.Picker}
					enabled={!loading}
					selectedValue={account}
					onValueChange={setAccount}
					dropdownIconColor={colorScheme==="light"?"#000":"#fff"}
				>
					<Picker.Item label="--Select--" value="" />
					{structure.accounts.map((i, ii) => (
						<Picker.Item label={i.name} value={i._id} key={ii} />
					))}
				</Picker></View>
				</>:null}
				{type==="self"?<>
				<Text style={styles.Label}>From Account</Text>
				<View style={styles.InputOuter}><Picker
					style={styles.Picker}
					enabled={!loading}
					selectedValue={fromaccount}
					onValueChange={setFromaccount}
					dropdownIconColor={colorScheme==="light"?"#000":"#fff"}
				>
					<Picker.Item label="--Select--" value="" />
					{structure.accounts.map((i, ii) => (
						<Picker.Item label={i.name} value={i._id} key={ii} />
					))}
				</Picker></View>
				</>:null}
				{type==="self"?<>
				<Text style={styles.Label}>To Account</Text>
				<View style={styles.InputOuter}><Picker
					style={styles.Picker}
					enabled={!loading}
					selectedValue={toaccount}
					onValueChange={setToaccount}
					dropdownIconColor={colorScheme==="light"?"#000":"#fff"}
				>
					<Picker.Item label="--Select--" value="" />
					{structure.accounts.map((i, ii) => (
						<Picker.Item label={i.name} value={i._id} key={ii} />
					))}
				</Picker></View>
				</>:null}
				<Text style={styles.Label}>Comment</Text>
				<TextInput editable={!loading} style={[styles.InputOuter, styles.Input]} value={comment} onChangeText={setComment} />
				<Text style={styles.Label}>Time</Text>
				<DateTimeInput enabled={!loading} value={date} onPick={setDate} />
				<Button disabled={!validated || loading} title="Save" onPress={submitForm} />
			</ScrollView>
		</View>
	);
}

function DateTimeInput(props: {value?: Date, onPick?: (date: Date) => void, enabled?: boolean}) {
	const colorScheme = useColorScheme()
	const styles = colorScheme==='dark'?darkStyles:lightStyles
	const [pickerState, setPickerState] = useState<null | 'date' | Date>(null)
	return (
		<>
			<TouchableOpacity disabled={props.enabled===false} style={[styles.InputOuter]} onPress={() => setPickerState('date')}>
				<Text style={styles.Input}>{props.value?formatDate(props.value):'Pick a date'}</Text>
			</TouchableOpacity>
			{pickerState!==null?
				<DateTimePicker
					value={pickerState==='date'?props.value || new Date():pickerState}
					mode={pickerState==='date'?'date':'time'}
					onChange={(e) => {
						if(pickerState==='date' && e.nativeEvent.timestamp) setPickerState(new Date(e.nativeEvent.timestamp))
						else if(pickerState==='date') setPickerState(null)
						else {
							if(props.onPick && e.nativeEvent.timestamp) props.onPick(new Date(e.nativeEvent.timestamp))
							setPickerState(null)
						}
					}}
				/>
			:null}
		</>
	)
}

function formatDate(d: Date) {
	return d.toLocaleString();
}

const lightStyles = StyleSheet.create({
	Outer: {
		flex: 1,
		backgroundColor: '#eee',
	},
	Header: {
		height: 50,
		flexDirection: 'row',
		backgroundColor: '#aaa',
	},
	HeaderButton: {
		height: 50,
		width: 50,
		alignItems: 'center',
		justifyContent: 'center',
	},
	HeaderIcon: {
		height: 25,
		width: 25,
	},
	ListItem: {
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#aaa',
	},
	TransactionItem: {
		backgroundColor: '#ddd',
	},
	SelfTransferItem: {
		flexDirection: 'row',
	},
	RollItem: {},
	SectionHeader: {
		backgroundColor: '#000',
		padding: 2,
	},
	SectionTitle: {
		color: '#fff',
	},
	ListItemTitle: {
		fontWeight: 'bold',
		fontSize: 16,
		color: '#000',
	},
	ListItemSubtitle: {
		fontSize: 12,
		color: '#000',
	},
	ListItemAmount: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	FormOuter: {
		flex: 1,
		backgroundColor: '#eee',
	},
	FormInner: {
		padding: 10,
	},
	Picker: {
		color: '#000',
	},
	InputOuter: {
		borderWidth: 0.5,
		height: 55,
		justifyContent: 'center',
		marginTop: 5,
		marginBottom: 10,
		borderColor: '#aaa',
	},
	Input: {
		paddingVertical: 0,
		paddingHorizontal: 20,
		textAlignVertical: 'center',
		fontSize: 16,
		color: '#000',
	},
	Label: {
		marginTop: 10,
		fontSize: 12,
		color: '#666',
	},
	SuccessText: {
		color: '#0a0',
	},
	WarningText: {
		color: '#f00',
	},
})

const darkStyles = StyleSheet.create({
	...lightStyles,
	Outer: {
		...lightStyles.Outer,
		backgroundColor: '#000',
	},
	Header: {
		...lightStyles.Header,
		backgroundColor: '#555',
	},
	HeaderIcon: {
		...lightStyles.HeaderIcon,
		tintColor: '#fff'
	},
	SectionHeader: {
		...lightStyles.SectionHeader,
		flexDirection: 'row',
		backgroundColor: '#555',
		marginTop: 5,
	},
	SectionTitle: {
		...lightStyles.SectionTitle,
		color: '#fff',
		fontSize: 14,
	},
	ListItem: {
		...lightStyles.ListItem,
		borderBottomColor: '#777',
	},
	ListItemTitle: {
		...lightStyles.ListItemTitle,
		color: '#fff',
	},
	ListItemSubtitle: {
		...lightStyles.ListItemSubtitle,
		color: '#fff',
	},
	TransactionItem: {
		...lightStyles.TransactionItem,
		backgroundColor: "#222",
	},
	FormOuter: {
		...lightStyles.FormOuter,
		backgroundColor: '#000',
	},
	Picker: {
		...lightStyles.FormOuter,
		color: '#fff',
	},
	InputOuter: {
		...lightStyles.InputOuter,
		borderColor: '#777',
	},
	Input: {
		...lightStyles.Input,
		color: '#fff',
	},
	Label: {
		...lightStyles.Label,
		color: '#aaa',
	},
	SuccessText: {
		color: '#3f3',
	},
	WarningText: {
		color: '#f44',
	},
})