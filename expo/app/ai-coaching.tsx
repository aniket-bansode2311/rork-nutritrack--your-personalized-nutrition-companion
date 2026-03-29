import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Send, Brain, User, Bot, BarChart3 } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { useDailyNutrition, useNutrition } from '@/hooks/useNutritionStore';
import InsightsDashboard from '@/components/insights/InsightsDashboard';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AICoachingScreen() {
  const { userProfile } = useNutrition();
  const { total, goals, percentages } = useDailyNutrition();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('insights');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${userProfile?.name || 'there'}! I'm your AI nutrition coach. I've analyzed your current intake and I'm here to help you achieve your health goals. What would you like to discuss today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const generateCoachingContext = () => {
    if (!userProfile) {
      return `You are a supportive, knowledgeable nutrition coach. The user is just getting started with their nutrition journey. Provide general, encouraging advice about healthy eating habits.`;
    }
    
    return `User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age}, Gender: ${userProfile.gender}
- Weight: ${userProfile.weight}kg, Height: ${userProfile.height}cm
- Activity Level: ${userProfile.activityLevel}
- Goal: ${userProfile.goal} weight

Today's Nutrition:
- Calories: ${total.calories.toFixed(0)}/${goals.calories} (${percentages.calories.toFixed(1)}%)
- Protein: ${total.protein.toFixed(1)}g/${goals.protein}g (${percentages.protein.toFixed(1)}%)
- Carbs: ${total.carbs.toFixed(1)}g/${goals.carbs}g (${percentages.carbs.toFixed(1)}%)
- Fat: ${total.fat.toFixed(1)}g/${goals.fat}g (${percentages.fat.toFixed(1)}%)

You are a supportive, knowledgeable nutrition coach. Provide personalized advice based on this data. Be encouraging, specific, and actionable. Focus on sustainable habits rather than quick fixes.`;
  };
  
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: generateCoachingContext(),
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content: inputText.trim(),
            },
          ],
        }),
      });
      
      const result = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.completion || 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('AI coaching error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const quickQuestions = [
    "How can I increase my protein intake?",
    "What are some healthy snack ideas?",
    "I'm always hungry, what should I do?",
    "How can I meal prep for the week?",
  ];
  
  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };
  
  const renderTabContent = () => {
    if (activeTab === 'insights') {
      return <InsightsDashboard userId={userProfile?.id || ''} />;
    }

    return (
      <View style={styles.chatContainer}>
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageContainer,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <View style={styles.messageHeader}>
                {message.role === 'user' ? (
                  <User size={16} color={colors.white} />
                ) : (
                  <Bot size={16} color={colors.primary} />
                )}
                <Text style={[
                  styles.messageRole,
                  message.role === 'user' ? styles.userMessageRole : styles.assistantMessageRole,
                ]}>
                  {message.role === 'user' ? 'You' : 'AI Coach'}
                </Text>
              </View>
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
              ]}>
                {message.content}
              </Text>
            </View>
          ))}
          
          {isLoading && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={styles.messageHeader}>
                <Bot size={16} color={colors.primary} />
                <Text style={styles.assistantMessageRole}>AI Coach</Text>
              </View>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>
        
        {messages.length === 1 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(question)}
                testID={`quick-question-${index}`}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your nutrition coach anything..."
            placeholderTextColor={colors.mediumGray}
            multiline
            maxLength={500}
            testID="coaching-input"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            testID="send-message"
          >
            <Send size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Brain size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>AI Nutrition Coach</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
          onPress={() => setActiveTab('insights')}
          testID="insights-tab"
        >
          <BarChart3 size={20} color={activeTab === 'insights' ? colors.white : colors.mediumGray} />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
            Insights
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
          testID="chat-tab"
        >
          <Bot size={20} color={activeTab === 'chat' ? colors.white : colors.mediumGray} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
            Chat
          </Text>
        </TouchableOpacity>
      </View>
      
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mediumGray,
    marginLeft: 8,
  },
  activeTabText: {
    color: colors.white,
  },
  chatContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  userMessageRole: {
    color: colors.white,
  },
  assistantMessageRole: {
    color: colors.primary,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.white,
  },
  assistantMessageText: {
    color: colors.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.darkGray,
    marginLeft: 8,
  },
  quickQuestionsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  quickQuestionButton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  quickQuestionText: {
    fontSize: 14,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
});