import { Component } from 'react'
import Taro from '@tarojs/taro'
import TabBar from '../components/TabBar'

type TabKey = 'home' | 'cart' | 'like' | 'profile'

export default class CustomTabBar extends Component<unknown, { current: TabKey }> {
  state = { current: 'home' as TabKey }

  onTab = (key: TabKey) => {
    this.setState({ current: key })
  }

  componentDidMount() {
    Taro.eventCenter.on('TAB_CURRENT', this.onTab)
  }

  componentWillUnmount() {
    Taro.eventCenter.off('TAB_CURRENT', this.onTab)
  }

  setSelected(index: number) {
    const keys: TabKey[] = ['home', 'cart', 'like', 'profile']
    this.setState({ current: keys[index] || 'home' })
  }

  render() {
    return <TabBar current={this.state.current} />
  }
}
